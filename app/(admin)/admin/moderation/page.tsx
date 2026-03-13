"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";

interface ModerationVideo {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
  products: { product: { id: string; name: string } }[];
  _count: { reports: number };
}

export default function ModerationQueuePage() {
  const queryClient = useQueryClient();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const { data: videos, isLoading, error } = useQuery<ModerationVideo[]>({
    queryKey: ["admin-moderation"],
    queryFn: async () => {
      const res = await fetch("/api/admin/moderation");
      if (!res.ok) throw new Error("Failed to fetch moderation queue");
      return res.json();
    },
  });

  const moderationAction = useMutation({
    mutationFn: async ({
      videoId,
      action,
      reason,
    }: {
      videoId: string;
      action: "approve" | "reject" | "ban_user";
      reason?: string;
    }) => {
      const res = await fetch(`/api/admin/moderation/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moderation"] });
      setActionInProgress(null);
    },
    onError: () => {
      setActionInProgress(null);
    },
  });

  const handleAction = (videoId: string, action: "approve" | "reject" | "ban_user") => {
    let reason: string | undefined;
    if (action === "reject" || action === "ban_user") {
      reason = window.prompt(`Reason for ${action === "reject" ? "rejection" : "banning user"}:`) ?? undefined;
      if (reason === undefined) return;
    }
    setActionInProgress(videoId);
    moderationAction.mutate({ videoId, action, reason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Failed to load moderation queue</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Moderation Queue</h1>
        <p className="text-sm text-muted mt-1">
          {videos?.length ?? 0} video{videos?.length !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {(!videos || videos.length === 0) ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No videos pending review. All clear!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-4"
            >
              {/* Thumbnail */}
              <div className="w-full sm:w-40 h-24 bg-card rounded-lg overflow-hidden shrink-0">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title ?? "Video"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                    No thumbnail
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text truncate">
                  {video.title ?? "Untitled Video"}
                </h3>
                <p className="text-xs text-muted mt-1">
                  by{" "}
                  <span className="text-text">
                    {video.user.name ?? video.user.username ?? video.user.email}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400">
                    {video.status}
                  </span>
                  {video._count.reports > 0 && (
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                      {video._count.reports} report{video._count.reports !== 1 ? "s" : ""}
                    </span>
                  )}
                  {video.products.length > 0 && (
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                      {video.products.length} product{video.products.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted mt-2">
                  Uploaded {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleAction(video.id, "approve")}
                  disabled={actionInProgress === video.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(video.id, "reject")}
                  disabled={actionInProgress === video.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(video.id, "ban_user")}
                  disabled={actionInProgress === video.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-destructive text-white text-sm font-semibold rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  Ban User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
