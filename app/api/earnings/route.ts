import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all commissions for this creator (CREATOR_SALE type)
  const commissions = await prisma.commission.findMany({
    where: { userId: user.id, type: "CREATOR_SALE" },
    include: {
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate: total earned (PAID)
  const paidAgg = await prisma.commission.aggregate({
    where: { userId: user.id, type: "CREATOR_SALE", status: "PAID" },
    _sum: { amount: true },
  });
  const totalEarned = paidAgg._sum.amount ?? 0;

  // Aggregate: pending amount
  const pendingAgg = await prisma.commission.aggregate({
    where: { userId: user.id, type: "CREATOR_SALE", status: "PENDING" },
    _sum: { amount: true },
  });
  const pendingAmount = pendingAgg._sum.amount ?? 0;

  // Aggregate: this month (any status)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthAgg = await prisma.commission.aggregate({
    where: {
      userId: user.id,
      type: "CREATOR_SALE",
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });
  const thisMonth = thisMonthAgg._sum.amount ?? 0;

  // Build monthly chart data (last 6 months)
  const monthlyChart: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      1
    );
    const monthLabel = monthDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    const agg = await prisma.commission.aggregate({
      where: {
        userId: user.id,
        type: "CREATOR_SALE",
        createdAt: { gte: monthDate, lt: monthEnd },
      },
      _sum: { amount: true },
    });

    monthlyChart.push({
      month: monthLabel,
      amount: agg._sum.amount ?? 0,
    });
  }

  // Get Stripe Connect status
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      stripeConnectId: true,
      stripeConnectOnboarded: true,
    },
  });

  // Format commissions list
  const commissionList = commissions.map((c) => ({
    id: c.id,
    orderId: c.orderId,
    orderNumber: c.order.orderNumber,
    amount: c.amount,
    currency: c.currency,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({
    totalEarned,
    pendingAmount,
    thisMonth,
    commissions: commissionList,
    monthlyChart,
    stripeConnectId: dbUser?.stripeConnectId ?? null,
    stripeConnectOnboarded: dbUser?.stripeConnectOnboarded ?? false,
  });
}
