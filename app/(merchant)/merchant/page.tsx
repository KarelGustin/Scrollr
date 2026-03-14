"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalRevenue: number;
  creatorPayouts: number;
  totalOrders: number;
  conversionRate: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    buyerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  topProduct: { title: string; revenue: number } | null;
  topCreator: { name: string; revenue: number } | null;
}

export default function MerchantOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-text">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats ?? {
    totalRevenue: 0,
    creatorPayouts: 0,
    totalOrders: 0,
    conversionRate: 0,
    recentOrders: [],
    topProduct: null,
    topCreator: null,
  };

  const statCards = [
    { label: "Total Revenue", value: `$${s.totalRevenue.toFixed(2)}`, change: "+12%", color: "text-success" },
    { label: "Creator Payouts", value: `$${s.creatorPayouts.toFixed(2)}`, change: "+8%", color: "text-accent" },
    { label: "Orders", value: s.totalOrders.toString(), change: "+15%", color: "text-social" },
    { label: "Conversion Rate", value: `${s.conversionRate.toFixed(1)}%`, change: "+3%", color: "text-warning" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold text-text">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
            <p className="text-xs text-muted mb-1">{stat.label}</p>
            <p className="text-2xl font-display font-bold text-text">{stat.value}</p>
            <span className={`text-xs font-medium ${stat.color}`}>{stat.change}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-display font-bold text-text mb-4">Recent Orders</h3>
          {s.recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted text-sm">No orders yet</p>
              <p className="text-muted text-xs mt-1">Orders will appear here as creators tag your products</p>
            </div>
          ) : (
            <div className="space-y-3">
              {s.recentOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text">{order.buyerName}</p>
                    <p className="text-xs text-muted">#{order.orderNumber.slice(-8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">${order.total.toFixed(2)}</p>
                    <span className="text-[10px] uppercase font-medium text-muted">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-display font-bold text-text mb-3">Top Product</h3>
            {s.topProduct ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text">{s.topProduct.title}</p>
                <p className="text-sm font-semibold text-success">${s.topProduct.revenue.toFixed(2)}</p>
              </div>
            ) : (
              <p className="text-muted text-sm">No product data yet</p>
            )}
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-display font-bold text-text mb-3">Top Creator</h3>
            {s.topCreator ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text">{s.topCreator.name}</p>
                <p className="text-sm font-semibold text-success">${s.topCreator.revenue.toFixed(2)}</p>
              </div>
            ) : (
              <p className="text-muted text-sm">No creator data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
