"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";

interface UserItem {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: string;
  trustLevel: string;
  strikeCount: number;
  bannedUntil: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: UserItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ["admin-users", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const userAction = useMutation({
    mutationFn: async (body: {
      userId: string;
      action: "change_role" | "apply_strike" | "reset_strikes" | "ban" | "unban";
      role?: string;
    }) => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setActionInProgress(null);
    },
    onError: () => {
      setActionInProgress(null);
    },
  });

  const handleAction = (
    userId: string,
    action: "change_role" | "apply_strike" | "reset_strikes" | "ban" | "unban",
    role?: string
  ) => {
    setActionInProgress(userId);
    userAction.mutate({ userId, action, role });
  };

  const trustLevelColors: Record<string, string> = {
    NEW: "bg-yellow-400/10 text-yellow-400",
    BASIC: "bg-blue-400/10 text-blue-400",
    ESTABLISHED: "bg-accent/10 text-accent",
    TRUSTED: "bg-green-400/10 text-green-400",
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const isBanned = (user: UserItem) =>
    user.bannedUntil && new Date(user.bannedUntil) > new Date();

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Failed to load users</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">User Management</h1>
        <p className="text-sm text-muted mt-1">
          {data?.total ?? 0} total user{data?.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email or username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-96 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-accent" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      User
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Trust
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Strikes
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Joined
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.users.map((user) => (
                    <tr key={user.id} className="hover:bg-card/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-text truncate max-w-[200px]">
                          {user.name ?? user.username ?? "No name"}
                        </p>
                        <p className="text-xs text-muted truncate max-w-[200px]">{user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            user.role === "ADMIN"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-muted/20 text-muted"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            trustLevelColors[user.trustLevel] ?? "bg-muted/20 text-muted"
                          }`}
                        >
                          {user.trustLevel}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-sm font-medium ${
                            user.strikeCount > 0 ? "text-destructive" : "text-muted"
                          }`}
                        >
                          {user.strikeCount}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {isBanned(user) ? (
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-400/10 text-green-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() =>
                              handleAction(
                                user.id,
                                "change_role",
                                user.role === "ADMIN" ? "USER" : "ADMIN"
                              )
                            }
                            disabled={actionInProgress === user.id}
                            className="px-2.5 py-1 bg-card text-muted text-[11px] font-semibold rounded-md hover:text-text transition-colors disabled:opacity-50"
                          >
                            {user.role === "ADMIN" ? "Demote" : "Promote"}
                          </button>
                          <button
                            onClick={() => handleAction(user.id, "apply_strike")}
                            disabled={actionInProgress === user.id}
                            className="px-2.5 py-1 bg-yellow-400/10 text-yellow-400 text-[11px] font-semibold rounded-md hover:bg-yellow-400/20 transition-colors disabled:opacity-50"
                          >
                            Strike
                          </button>
                          {user.strikeCount > 0 && (
                            <button
                              onClick={() => handleAction(user.id, "reset_strikes")}
                              disabled={actionInProgress === user.id}
                              className="px-2.5 py-1 bg-accent/10 text-accent text-[11px] font-semibold rounded-md hover:bg-accent/20 transition-colors disabled:opacity-50"
                            >
                              Reset
                            </button>
                          )}
                          {isBanned(user) ? (
                            <button
                              onClick={() => handleAction(user.id, "unban")}
                              disabled={actionInProgress === user.id}
                              className="px-2.5 py-1 bg-green-400/10 text-green-400 text-[11px] font-semibold rounded-md hover:bg-green-400/20 transition-colors disabled:opacity-50"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(user.id, "ban")}
                              disabled={actionInProgress === user.id}
                              className="px-2.5 py-1 bg-destructive text-white text-[11px] font-semibold rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                              Ban
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
                  Page {page} of {totalPages}
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
