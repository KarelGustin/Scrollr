"use client";

import { useEffect, useState } from "react";

interface CreatorStat {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string;
  revenue: number;
  postCount: number;
  totalViews: number;
}

export default function MerchantCreatorsPage() {
  const [creators, setCreators] = useState<CreatorStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/creators")
      .then((r) => r.json())
      .then((data) => setCreators(data.creators ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...creators].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-text">Creators</h1>
      <p className="text-sm text-muted">Creators who have tagged your products in their videos</p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted text-sm">No creators yet</p>
          <p className="text-muted text-xs mt-1">When creators tag your products in videos, they&apos;ll appear here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map((c) => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-muted">
                      {(c.name ?? c.username ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-text">{c.name ?? c.username}</p>
                  {c.username && <p className="text-xs text-muted">@{c.username}</p>}
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-muted">{c.postCount} posts</span>
                    <span className="text-xs text-muted">{c.totalViews} views</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">${c.revenue.toFixed(2)}</p>
                  <p className="text-[10px] text-muted uppercase">Revenue</p>
                </div>
                <a
                  href={`mailto:${c.email}`}
                  className="px-3 py-1.5 bg-surface text-text text-xs font-medium rounded-lg hover:bg-surface/80 transition-colors touch-target flex items-center"
                >
                  Contact
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
