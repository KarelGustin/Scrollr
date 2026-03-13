"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type CommissionStatus = "PENDING" | "PAID" | "FAILED";

interface Commission {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: CommissionStatus;
  createdAt: string;
}

interface EarningsData {
  totalEarned: number;
  pendingAmount: number;
  thisMonth: number;
  commissions: Commission[];
  monthlyChart: { month: string; amount: number }[];
  stripeConnectId: string | null;
  stripeConnectOnboarded: boolean;
}

const statusColors: Record<CommissionStatus, { bg: string; text: string }> = {
  PAID: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  PENDING: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  FAILED: { bg: "bg-red-500/15", text: "text-red-400" },
};

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EarningsPage() {
  const { user } = useAuth();

  const {
    data: earnings,
    isLoading,
    error,
  } = useQuery<EarningsData>({
    queryKey: ["earnings"],
    queryFn: async () => {
      const res = await fetch("/api/earnings");
      if (!res.ok) throw new Error("Failed to fetch earnings");
      return res.json();
    },
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create connect account");
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
  });

  const dashboardMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/connect");
      if (!res.ok) throw new Error("Failed to get dashboard link");
      return res.json();
    },
    onSuccess: (data: { dashboardUrl?: string }) => {
      if (data.dashboardUrl) {
        window.open(data.dashboardUrl, "_blank");
      }
    },
  });

  const chartData = useMemo(() => earnings?.monthlyChart ?? [], [earnings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">
          Failed to load earnings. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Earnings</h1>
        <p className="text-sm text-muted mt-1">
          Track your commissions and payouts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Earned
          </p>
          <p className="text-2xl font-display font-bold text-text mt-2 tabular-nums">
            {formatCurrency(earnings?.totalEarned ?? 0)}
          </p>
          <p className="text-xs text-muted mt-1">All time (paid out)</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            Pending Payouts
          </p>
          <p className="text-2xl font-display font-bold text-yellow-400 mt-2 tabular-nums">
            {formatCurrency(earnings?.pendingAmount ?? 0)}
          </p>
          <p className="text-xs text-muted mt-1">Awaiting transfer</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            This Month
          </p>
          <p className="text-2xl font-display font-bold text-accent mt-2 tabular-nums">
            {formatCurrency(earnings?.thisMonth ?? 0)}
          </p>
          <p className="text-xs text-muted mt-1">All commissions</p>
        </div>
      </div>

      {/* Stripe Connect Status */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-sm font-medium text-text">
              Stripe Connect
            </h2>
            <p className="text-xs text-muted mt-1">
              {earnings?.stripeConnectOnboarded
                ? "Your account is connected and ready to receive payouts."
                : "Connect your Stripe account to receive commission payouts."}
            </p>
          </div>
          {earnings?.stripeConnectOnboarded ? (
            <button
              onClick={() => dashboardMutation.mutate()}
              disabled={dashboardMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-text bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50"
            >
              {dashboardMutation.isPending ? "Loading..." : "View Stripe Dashboard"}
            </button>
          ) : (
            <button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-[#09090b] bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {connectMutation.isPending ? "Setting up..." : "Connect Stripe"}
            </button>
          )}
        </div>
        {connectMutation.isError && (
          <p className="text-xs text-red-400 mt-2">
            Failed to start Stripe onboarding. Please try again.
          </p>
        )}
      </div>

      {/* Monthly Earnings Chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium text-muted mb-4">
          Monthly Earnings
        </h2>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted">No earnings data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#71717a" }}
                itemStyle={{ color: "#fafafa" }}
                formatter={(value: number) => [formatCurrency(value), "Earnings"]}
              />
              <Bar
                dataKey="amount"
                fill="#c8ff00"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Commission History Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-muted">
            Commission History
          </h2>
        </div>
        {!earnings?.commissions?.length ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted">No commissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {earnings.commissions.map((commission) => {
                  const colors = statusColors[commission.status];
                  return (
                    <tr
                      key={commission.id}
                      className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-text font-mono">
                        {commission.orderNumber}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted">
                        {formatDate(commission.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-sm text-text text-right tabular-nums">
                        {formatCurrency(commission.amount, commission.currency)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                        >
                          {commission.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
