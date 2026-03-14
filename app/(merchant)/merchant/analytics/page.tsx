"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  topProducts: Array<{ title: string; revenue: number; views: number }>;
  topCreators: Array<{ name: string; revenue: number }>;
  revenueOverTime: Array<{ date: string; revenue: number }>;
  funnel: { views: number; cartAdds: number; purchases: number };
}

export default function MerchantAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetch(`/api/merchant/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-text">Analytics</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const d = data ?? {
    topProducts: [],
    topCreators: [],
    revenueOverTime: [],
    funnel: { views: 0, cartAdds: 0, purchases: 0 },
  };

  const maxRevenue = Math.max(...d.revenueOverTime.map((r) => r.revenue), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-text">Analytics</h1>
        <div className="flex bg-surface rounded-xl overflow-hidden border border-border">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                period === p ? "bg-accent text-white" : "text-muted hover:text-text"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-sm font-display font-bold text-text mb-4">Revenue Over Time</h3>
        {d.revenueOverTime.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No revenue data yet</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {d.revenueOverTime.map((r, i) => (
              <div
                key={i}
                className="flex-1 bg-accent/20 rounded-t relative group"
                style={{ height: `${(r.revenue / maxRevenue) * 100}%`, minHeight: "4px" }}
              >
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-text text-bg text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${r.revenue.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-display font-bold text-text mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {[
              { label: "Views", value: d.funnel.views, color: "bg-social" },
              { label: "Cart Adds", value: d.funnel.cartAdds, color: "bg-warning" },
              { label: "Purchases", value: d.funnel.purchases, color: "bg-success" },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">{step.label}</span>
                  <span className="text-text font-medium">{step.value}</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all`}
                    style={{ width: `${d.funnel.views > 0 ? (step.value / d.funnel.views) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-display font-bold text-text mb-4">Best Performing Products</h3>
          {d.topProducts.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">No product data yet</p>
          ) : (
            <div className="space-y-3">
              {d.topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-5">{i + 1}.</span>
                    <span className="text-sm text-text">{p.title}</span>
                  </div>
                  <span className="text-sm font-semibold text-success">${p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top creators */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-sm font-display font-bold text-text mb-4">Best Performing Creators</h3>
        {d.topCreators.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">No creator data yet</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.topCreators.slice(0, 6).map((c, i) => (
              <div key={i} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-text">{c.name}</span>
                <span className="text-sm font-semibold text-success">${c.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
