import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    totalUsers,
    totalCreators,
    totalMerchants,
    totalOrders,
    totalVideos,
    totalProducts,
    pendingApplications,
    revenueAgg,
    platformFeesAgg,
    creatorPayoutsAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CREATOR" } }),
    prisma.merchant.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.video.count({ where: { status: "READY" } }),
    prisma.product.count({ where: { published: true } }),
    prisma.creatorApplication.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.aggregate({ _sum: { platformFee: true } }),
    prisma.commission.aggregate({
      where: { type: "CREATOR_SALE", status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  // Recent orders (last 10)
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      buyerName: true,
      total: true,
      currency: true,
      status: true,
      createdAt: true,
      merchant: { select: { storeName: true } },
    },
  });

  // Recent users (last 10)
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    totalUsers,
    totalCreators,
    totalMerchants,
    totalOrders,
    totalVideos,
    totalProducts,
    pendingApplications,
    totalRevenue: revenueAgg._sum.total ?? 0,
    scrollrEarnings: platformFeesAgg._sum.platformFee ?? 0,
    creatorPayouts: creatorPayoutsAgg._sum.amount ?? 0,
    recentOrders,
    recentUsers,
  });
}
