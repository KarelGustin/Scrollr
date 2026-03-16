"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";

interface VideoItem {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  status: string;
  published: boolean;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
  };
  _count: {
    reports: number;
    products: number;
  };
}

interface ContentResponse {
  videos: VideoItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function ContentManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery<ContentResponse>({
    queryKey: ["admin-content", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/content?${params}`);
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      setDeleteConfirm(null);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ videoId, published }: { videoId: string; published: boolean }) => {
      const res = await fetch(`/api/admin/moderation/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: published ? "reject" : "approve",
          reason: published ? "Unpublished by admin" : "Published by admin",
        }),
      });
      if (!res.ok) throw new Error("Failed to update video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const statusColors: Record<string, string> = {
    READY: "bg-success/10 text-success",
    PROCESSING: "bg-warning/10 text-warning",
    PENDING_REVIEW: "bg-yellow-400/10 text-yellow-400",
    REJECTED: "bg-destructive/10 text-destructive",
    ERROR: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Content Management</h1>
        <p className="text-sm text-muted mt-1">
          Manage all videos and content on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title, creator..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] sm:max-w-sm px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="all">All Statuses</option>
          <option value="READY">Ready</option>
          <option value="PROCESSING">Processing</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="REJECTED">Rejected</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-accent" />
        </div>
      ) : !data?.videos.length ? (
        <div className="text-center py-20">
          <p className="text-muted">No content found</p>
        </div>
      ) : (
        <>
          {/* Content Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Content</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Creator</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Reports</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Products</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Created</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.videos.map((video) => (
                    <tr key={video.id} className="hover:bg-card/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title || "Video"}
                              className="w-16 h-10 rounded-lg object-cover bg-surface"
                            />
                          ) : (
                            <div className="w-16 h-10 rounded-lg bg-card flex items-center justify-center text-xs text-muted">
                              No thumb
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-text truncate max-w-[200px]">
                              {video.title || "Untitled"}
                            </p>
                            <p className="text-xs text-muted truncate max-w-[200px]">
                              {video.category || "No category"}
                              {video.duration ? ` · ${Math.round(video.duration)}s` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-text">{video.user.name || video.user.username || "Unknown"}</p>
                        <p className="text-xs text-muted">{video.user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColors[video.status] || "bg-muted/20 text-muted"}`}>
                          {video.status}
                        </span>
                        {video.published && (
                          <span className="ml-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success">
                            Live
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-medium ${video._count.reports > 0 ? "text-destructive" : "text-muted"}`}>
                          {video._count.reports}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-muted">{video._count.products}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => togglePublishMutation.mutate({
                              videoId: video.id,
                              published: video.published,
                            })}
                            disabled={togglePublishMutation.isPending}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors disabled:opacity-50 ${
                              video.published
                                ? "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                                : "bg-success/10 text-success hover:bg-success/20"
                            }`}
                          >
                            {video.published ? "Unpublish" : "Publish"}
                          </button>
                          {deleteConfirm === video.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => deleteMutation.mutate(video.id)}
                                disabled={deleteMutation.isPending}
                                className="px-2.5 py-1 bg-destructive text-white text-[11px] font-semibold rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
                              >
                                {deleteMutation.isPending ? "..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2.5 py-1 bg-card text-muted text-[11px] font-semibold rounded-md hover:text-text transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(video.id)}
                              className="px-2.5 py-1 bg-destructive/10 text-destructive text-[11px] font-semibold rounded-md hover:bg-destructive/20 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted">
                  Page {page} of {totalPages} ({data.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-card text-muted text-xs font-semibold rounded-md hover:text-text transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 bg-card text-muted text-xs font-semibold rounded-md hover:text-text transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
