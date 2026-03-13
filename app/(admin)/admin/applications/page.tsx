"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Application {
  id: string;
  status: ApplicationStatus;
  category: string;
  socialLinks: Record<string, string>;
  pitch: string;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
}

const STATUS_TABS: { value: ApplicationStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const CATEGORY_LABELS: Record<string, string> = {
  fashion: "Fashion",
  beauty: "Beauty",
  tech: "Tech",
  fitness: "Fitness",
  food: "Food",
  home: "Home",
  art: "Art & Design",
  other: "Other",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  youtube: "YT",
  twitter: "X",
};

export default function AdminApplicationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>("PENDING");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-applications", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/creator-applications?status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ applications: Application[]; total: number }>;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      adminNote,
    }: {
      id: string;
      action: "approve" | "reject";
      adminNote?: string;
    }) => {
      const res = await fetch(`/api/admin/creator-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      setRejectingId(null);
      setRejectNote("");
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">
          Creator Applications
        </h1>
        <p className="text-sm text-muted mt-1">
          Review and manage creator applications
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 w-fit mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === tab.value
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-text"
            }`}
          >
            {tab.label}
            {tab.value === "PENDING" && data?.total ? (
              <span className="ml-1.5 text-xs opacity-80">({data.total})</span>
            ) : null}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-accent" />
        </div>
      ) : !data?.applications?.length ? (
        <div className="text-center py-20">
          <p className="text-sm text-muted">No {statusFilter.toLowerCase()} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.applications.map((app) => (
            <div
              key={app.id}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* User info */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center overflow-hidden border border-border">
                    {app.user.avatarUrl ? (
                      <img
                        src={app.user.avatarUrl}
                        alt={app.user.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-muted">
                        {(app.user.name || app.user.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">
                      {app.user.name || app.user.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted">{app.user.email}</p>
                  </div>
                </div>

                {/* Application details */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                      {CATEGORY_LABELS[app.category] || app.category}
                    </span>
                    {Object.entries(app.socialLinks).map(([platform, handle]) => (
                      <span
                        key={platform}
                        className="inline-block text-xs px-2 py-0.5 rounded-md bg-surface text-muted border border-border"
                      >
                        {PLATFORM_LABELS[platform] || platform}: {String(handle)}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-text">{app.pitch}</p>

                  <p className="text-xs text-muted">
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                    {app.user.username && (
                      <> &middot; @{app.user.username}</>
                    )}
                  </p>

                  {app.adminNote && (
                    <p className="text-xs text-muted italic">
                      Note: {app.adminNote}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {statusFilter === "PENDING" && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => actionMutation.mutate({ id: app.id, action: "approve" })}
                      disabled={actionMutation.isPending}
                      className="flex-1 sm:flex-none px-4 py-2 bg-success/10 text-success text-sm font-semibold rounded-xl hover:bg-success/20 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === app.id ? null : app.id)}
                      disabled={actionMutation.isPending}
                      className="flex-1 sm:flex-none px-4 py-2 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Reject note input */}
              {rejectingId === app.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (optional, will be emailed to applicant)"
                    rows={2}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-accent/50 placeholder:text-muted/60"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setRejectingId(null); setRejectNote(""); }}
                      className="px-4 py-2 text-sm text-muted hover:text-text transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        actionMutation.mutate({
                          id: app.id,
                          action: "reject",
                          adminNote: rejectNote || undefined,
                        })
                      }
                      disabled={actionMutation.isPending}
                      className="px-4 py-2 bg-destructive text-white text-sm font-semibold rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
