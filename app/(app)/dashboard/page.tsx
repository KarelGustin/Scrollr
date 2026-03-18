"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useProducts } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/StatCard";
import { CreatorApplicationStatus } from "@/components/dashboard/CreatorApplicationStatus";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { UploadQuota } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const { user: session } = useAuth();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics("7d");
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: quota } = useQuery<UploadQuota>({
    queryKey: ["upload-quota"],
    queryFn: async () => {
      const res = await fetch("/api/upload/quota");
      if (!res.ok) throw new Error("Failed to fetch quota");
      return res.json();
    },
  });

  interface DashboardStats {
    views: number;
    clicks: number;
    conversionRate: number;
    revenue: number;
    profitShare: number;
    orders: number;
    period: string;
  }

  const { data: dashStats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats?period=7d");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
  });

  const [copied, setCopied] = useState(false);

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(
    {}
  );

  const username =
    session?.username ?? "you";
  const feedUrl = `scrollr.co/@${username}`;

  // Compute today's stats from analytics
  const todayViews =
    analytics?.views?.[analytics.views.length - 1]?.count ?? 0;
  const todayClicks =
    analytics?.clicks?.[analytics.clicks.length - 1]?.count ?? 0;
  const todayCtr =
    todayViews > 0 ? ((todayClicks / todayViews) * 100).toFixed(1) : "0.0";
  // Format currency for display
  const formatCurrency = (amount: number) =>
    amount >= 1000
      ? `$${(amount / 1000).toFixed(1)}k`
      : `$${amount.toFixed(2)}`;

  // Merge views and clicks for sparkline chart
  const chartData =
    analytics?.views?.map((v, i) => ({
      date: v.date,
      views: v.count,
      clicks: analytics.clicks?.[i]?.count ?? 0,
    })) ?? [];

  // Top 3 products by CTR
  const topProducts = [...(analytics?.products ?? [])]
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 3);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${feedUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checklistItems = [
    { id: "profile", label: "Complete your profile" },
    { id: "product", label: "Add your first product" },
    { id: "video", label: "Upload a video" },
    { id: "publish", label: "Publish a product" },
    { id: "share", label: "Share your feed link" },
  ];

  const toggleChecklist = (id: string) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (analyticsLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-8 py-6 max-w-5xl mx-auto">
      {/* Creator application status */}
      <CreatorApplicationStatus />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text">
          Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">
          Welcome back, {session?.name ?? "Creator"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Views Today"
          value={todayViews}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />
        <StatCard
          title="Clicks Today"
          value={todayClicks}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          }
        />
        <StatCard
          title="Conversion Rate"
          value={`${todayCtr}%`}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(dashStats?.revenue ?? 0)}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          title="Profit Share"
          value={formatCurrency(dashStats?.profitShare ?? 0)}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
          }
        />
      </div>

      {/* Upload quota */}
      {quota && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-muted mb-4">
            Upload Quota
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted">Today</span>
                <span className="text-xs text-text font-medium">
                  {quota.daily.used}/{quota.daily.limit}
                </span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (quota.daily.used / quota.daily.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted">This Week</span>
                <span className="text-xs text-text font-medium">
                  {quota.weekly.used}/{quota.weekly.limit}
                </span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-social rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (quota.weekly.used / quota.weekly.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
            <span>Max duration: {quota.maxDurationSeconds}s</span>
            <span>Max size: {quota.maxFileSizeMB}MB</span>
          </div>
        </div>
      )}

      {/* Sparkline chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-muted mb-4">
            Last 7 Days
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "var(--text)",
                }}
                labelStyle={{ color: "var(--muted)" }}
                itemStyle={{ color: "var(--text)" }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#FF6B4A"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className="w-3 h-0.5 bg-accent rounded" />
              Views
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className="w-3 h-0.5 bg-social rounded" />
              Clicks
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top products by CTR */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-muted mb-4">
            Top Products by CTR
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">
              No product data yet
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-muted">
                      {index + 1}
                    </span>
                    <span className="text-sm text-text truncate max-w-[180px]">
                      {product.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-accent">
                    {product.ctr.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your feed is live card */}
        <div className="bg-card rounded-xl border border-border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="text-sm font-medium text-text">
                Your feed is live
              </h2>
            </div>
            <p className="text-xs text-muted mb-4">
              Share your feed link with your audience
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text truncate">
              {feedUrl}
            </div>
            <Button size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </div>

      {/* Onboarding checklist */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium text-muted mb-4">
          Getting Started
        </h2>
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleChecklist(item.id)}
              className="flex items-center gap-3 w-full text-left group"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checklistState[item.id]
                    ? "bg-accent border-accent"
                    : "border-border group-hover:border-muted"
                }`}
              >
                {checklistState[item.id] && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm transition-colors ${
                  checklistState[item.id]
                    ? "text-muted line-through"
                    : "text-text"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
