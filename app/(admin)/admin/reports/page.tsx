"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";

interface ReportItem {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  video: {
    id: string;
    title: string | null;
    thumbnailUrl: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      username: string | null;
    };
  };
  reporter: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
}

type ReportAction = "dismiss" | "remove_video" | "warn_user" | "ban_user";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const { data: reports, isLoading, error } = useQuery<ReportItem[]>({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  const reportAction = useMutation({
    mutationFn: async ({
      reportId,
      action,
    }: {
      reportId: string;
      action: ReportAction;
    }) => {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setActionInProgress(null);
    },
    onError: () => {
      setActionInProgress(null);
    },
  });

  const handleAction = (reportId: string, action: ReportAction) => {
    setActionInProgress(reportId);
    reportAction.mutate({ reportId, action });
  };

  // Group reports by video
  const groupedByVideo = (reports ?? []).reduce<
    Record<string, { video: ReportItem["video"]; reports: ReportItem[] }>
  >((acc, report) => {
    const videoId = report.video.id;
    if (!acc[videoId]) {
      acc[videoId] = { video: report.video, reports: [] };
    }
    acc[videoId].reports.push(report);
    return acc;
  }, {});

  const reasonLabels: Record<string, string> = {
    SEXUAL_CONTENT: "Sexual Content",
    VIOLENCE: "Violence",
    HATE_SPEECH: "Hate Speech",
    SPAM: "Spam",
    SCAM: "Scam",
    INVOLVES_MINOR: "Involves Minor",
    COPYRIGHT: "Copyright",
    SELF_HARM: "Self Harm",
    OTHER: "Other",
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
        <p className="text-destructive">Failed to load reports</p>
      </div>
    );
  }

  const videoGroups = Object.values(groupedByVideo);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Reports</h1>
        <p className="text-sm text-muted mt-1">
          {reports?.length ?? 0} pending report{reports?.length !== 1 ? "s" : ""} across{" "}
          {videoGroups.length} video{videoGroups.length !== 1 ? "s" : ""}
        </p>
      </div>

      {videoGroups.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No pending reports. All clear!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {videoGroups.map(({ video, reports: videoReports }) => (
            <div
              key={video.id}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              {/* Video header */}
              <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-32 h-20 bg-card rounded-lg overflow-hidden shrink-0">
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text truncate">
                    {video.title ?? "Untitled Video"}
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    Creator:{" "}
                    <span className="text-text">
                      {video.user.name ?? video.user.username ?? video.user.email}
                    </span>
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                    {videoReports.length} report{videoReports.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Individual reports */}
              <div className="divide-y divide-border">
                {videoReports.map((report) => (
                  <div key={report.id} className="p-5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                          {reasonLabels[report.reason] ?? report.reason}
                        </span>
                        <span className="text-[11px] text-muted">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Reported by:{" "}
                        <span className="text-text">
                          {report.reporter.name ?? report.reporter.username ?? report.reporter.email}
                        </span>
                      </p>
                      {report.details && (
                        <p className="text-xs text-muted mt-2 bg-card rounded-lg p-3">
                          {report.details}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(report.id, "dismiss")}
                        disabled={actionInProgress === report.id}
                        className="px-3 py-1.5 bg-card text-muted text-xs font-semibold rounded-lg hover:text-text hover:bg-card/80 transition-colors disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleAction(report.id, "remove_video")}
                        disabled={actionInProgress === report.id}
                        className="px-3 py-1.5 bg-orange-400/10 text-orange-400 text-xs font-semibold rounded-lg hover:bg-orange-400/20 transition-colors disabled:opacity-50"
                      >
                        Remove Video
                      </button>
                      <button
                        onClick={() => handleAction(report.id, "warn_user")}
                        disabled={actionInProgress === report.id}
                        className="px-3 py-1.5 bg-yellow-400/10 text-yellow-400 text-xs font-semibold rounded-lg hover:bg-yellow-400/20 transition-colors disabled:opacity-50"
                      >
                        Warn User
                      </button>
                      <button
                        onClick={() => handleAction(report.id, "ban_user")}
                        disabled={actionInProgress === report.id}
                        className="px-3 py-1.5 bg-destructive text-white text-xs font-semibold rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                      >
                        Ban User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
