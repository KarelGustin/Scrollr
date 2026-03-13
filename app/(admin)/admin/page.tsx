"use client";

import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalCreators: number;
  totalMerchants: number;
  totalOrders: number;
  totalVideos: number;
  totalProducts: number;
  pendingApplications: number;
  totalRevenue: number;
  scrollrEarnings: number;
  creatorPayouts: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    buyerName: string;
    total: number;
    currency: string;
    status: string;
    createdAt: string;
    merchant: { storeName: string | null };
  }[];
  recentUsers: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    role: string;
    createdAt: string;
  }[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), color: "text-accent", bg: "bg-accent/10" },
    { label: "Creators", value: stats.totalCreators.toLocaleString(), color: "text-social", bg: "bg-social/10" },
    { label: "Merchants", value: stats.totalMerchants.toLocaleString(), color: "text-warning", bg: "bg-warning/10" },
    { label: "Total Revenue", value: fmt(stats.totalRevenue), color: "text-success", bg: "bg-success/10" },
    { label: "Scrollr Earnings", value: fmt(stats.scrollrEarnings), color: "text-accent", bg: "bg-accent/10" },
    { label: "Creator Payouts", value: fmt(stats.creatorPayouts), color: "text-social", bg: "bg-social/10" },
    { label: "Orders", value: stats.totalOrders.toLocaleString(), color: "text-text", bg: "bg-surface" },
    { label: "Videos", value: stats.totalVideos.toLocaleString(), color: "text-text", bg: "bg-surface" },
    { label: "Products", value: stats.totalProducts.toLocaleString(), color: "text-text", bg: "bg-surface" },
    { label: "Pending Apps", value: stats.pendingApplications.toLocaleString(), color: "text-warning", bg: "bg-warning/10", href: "/admin/applications" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Admin Overview</h1>
        <p className="text-sm text-muted mt-1">Platform statistics at a glance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {kpis.map((kpi) => {
          const Card = (
            <div className={`${kpi.bg} border border-border rounded-xl p-4`}>
              <p className="text-xs text-muted mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href}>{Card}</Link>
          ) : (
            <div key={kpi.label}>{Card}</div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium text-text">Recent Orders</h2>
            <span className="text-xs text-muted">{stats.totalOrders} total</span>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No orders yet</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text">{order.buyerName}</p>
                    <p className="text-xs text-muted">
                      {order.merchant.storeName} &middot; #{order.orderNumber.slice(-6)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency }).format(order.total)}
                    </p>
                    <p className="text-xs text-muted">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium text-text">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-accent font-medium">View all</Link>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No users yet</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text">{u.name || u.username || u.email}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    u.role === "ADMIN" ? "bg-destructive/10 text-destructive" :
                    u.role === "CREATOR" ? "bg-accent/10 text-accent" :
                    "bg-surface text-muted"
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
