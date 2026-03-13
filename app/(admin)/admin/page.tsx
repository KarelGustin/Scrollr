export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

async function getAdminStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalUsers, totalVideos, pendingReviews, openReports, rejectedToday] =
    await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.video.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.video.count({
        where: {
          status: "REJECTED",
          updatedAt: { gte: startOfDay },
        },
      }),
    ]);

  return { totalUsers, totalVideos, pendingReviews, openReports, rejectedToday };
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Total Videos",
      value: stats.totalVideos,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      label: "Open Reports",
      value: stats.openReports,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Rejected Today",
      value: stats.rejectedToday,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Admin Overview</h1>
        <p className="text-sm text-muted mt-1">Platform statistics and quick actions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.bg} mb-3`}>
              <span className={`text-lg font-bold ${card.color}`}>
                {card.value > 99 ? "99+" : card.value}
              </span>
            </div>
            <p className="text-sm text-muted">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color} mt-1`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
