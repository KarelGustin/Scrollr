"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Spinner } from "@/components/ui/Spinner";
import type { TimeRange } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const ranges: { value: TimeRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

type SortKey = "name" | "views" | "clicks" | "ctr";
type SortDir = "asc" | "desc";

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const range = (searchParams.get("range") as TimeRange) || "7d";
  const sortKey = (searchParams.get("sort") as SortKey) || "ctr";
  const sortDir = (searchParams.get("dir") as SortDir) || "desc";

  const { data: analytics, isLoading } = useAnalytics(range);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const handleRangeChange = (newRange: TimeRange) => {
    setParam("range", newRange);
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setParam("dir", sortDir === "asc" ? "desc" : "asc");
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", key);
      params.set("dir", "desc");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  // Merge views and clicks for chart
  const chartData = useMemo(
    () =>
      analytics?.views?.map((v, i) => ({
        date: v.date,
        views: v.count,
        clicks: analytics.clicks?.[i]?.count ?? 0,
      })) ?? [],
    [analytics]
  );

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...(analytics?.products ?? [])];
    list.sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortDir === "asc" ? numA - numB : numB - numA;
    });
    return list;
  }, [analytics?.products, sortKey, sortDir]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (column !== sortKey) return null;
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`inline ml-1 transition-transform ${
          sortDir === "asc" ? "rotate-180" : ""
        }`}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">
            Analytics
          </h1>
          <p className="text-sm text-muted mt-1">
            Track your feed performance
          </p>
        </div>

        {/* Time range tabs */}
        <div className="flex items-center bg-surface border border-border rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRangeChange(r.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                range === r.value
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-text"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium text-muted mb-4">
          Views vs Clicks
        </h2>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
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
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "var(--muted)" }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#FF6B4A"
                strokeWidth={2}
                dot={false}
                name="Views"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                name="Clicks"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Product performance table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-muted">
            Product Performance
          </h2>
        </div>
        {sortedProducts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted">No product data yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-text transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    Product
                    <SortIcon column="name" />
                  </th>
                  <th
                    className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-text transition-colors"
                    onClick={() => handleSort("views")}
                  >
                    Views
                    <SortIcon column="views" />
                  </th>
                  <th
                    className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-text transition-colors"
                    onClick={() => handleSort("clicks")}
                  >
                    Clicks
                    <SortIcon column="clicks" />
                  </th>
                  <th
                    className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-text transition-colors"
                    onClick={() => handleSort("ctr")}
                  >
                    CTR
                    <SortIcon column="ctr" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm text-text">
                      {product.name}
                    </td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">
                      {product.views.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">
                      {product.clicks.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-accent text-right tabular-nums">
                      {product.ctr.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
