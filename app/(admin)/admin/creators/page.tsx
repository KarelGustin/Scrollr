"use client";

import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";

interface Creator {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  bannedUntil: string | null;
  _count: { videos: number; products: number };
  totalEarnings: number;
  totalSales: number;
  totalRevenue: number;
  scrollrEarnings: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function AdminCreatorsPage() {
  const { data, isLoading } = useQuery<{ creators: Creator[]; total: number }>({
    queryKey: ["admin-creators"],
    queryFn: async () => {
      const res = await fetch("/api/admin/creators");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Creators</h1>
        <p className="text-sm text-muted mt-1">{data?.total ?? 0} creators on platform</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-accent" />
        </div>
      ) : !data?.creators.length ? (
        <p className="text-sm text-muted text-center py-20">No creators yet</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Creator</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Videos</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Products</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Sales</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Revenue</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Earnings</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Scrollr</th>
                </tr>
              </thead>
              <tbody>
                {data.creators.map((creator) => (
                  <tr key={creator.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
                          {creator.avatarUrl ? (
                            <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-muted">
                              {(creator.name || creator.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-text font-medium">{creator.name || creator.username}</p>
                          <p className="text-xs text-muted">{creator.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">{creator._count.videos}</td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">{creator._count.products}</td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">{creator.totalSales}</td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">{fmt(creator.totalRevenue)}</td>
                    <td className="px-5 py-3 text-sm text-accent text-right tabular-nums font-medium">{fmt(creator.totalEarnings)}</td>
                    <td className="px-5 py-3 text-sm text-success text-right tabular-nums font-medium">{fmt(creator.scrollrEarnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
