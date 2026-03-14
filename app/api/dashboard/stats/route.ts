import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "7d";

  // Calculate the date range
  let dateFrom: Date;
  const now = new Date();

  switch (period) {
    case "30d":
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      dateFrom = new Date(0);
      break;
    case "7d":
    default:
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
  }

  // Get all video IDs for this creator
  const creatorVideos = await prisma.video.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const videoIds = creatorVideos.map((v) => v.id);

  // Aggregate views (VIDEO_START events on creator's videos)
  const views = await prisma.event.count({
    where: {
      videoId: { in: videoIds },
      type: "VIDEO_START",
      createdAt: { gte: dateFrom },
    },
  });

  // Aggregate clicks (SHOP_CLICK + ADD_TO_CART events on creator's videos)
  const clicks = await prisma.event.count({
    where: {
      videoId: { in: videoIds },
      type: { in: ["SHOP_CLICK", "ADD_TO_CART"] },
      createdAt: { gte: dateFrom },
    },
  });

  // Conversion rate
  const conversionRate = views > 0 ? Number(((clicks / views) * 100).toFixed(2)) : 0;

  // Revenue: sum of total from Orders where creatorId matches
  const revenueResult = await prisma.order.aggregate({
    where: {
      creatorId: user.id,
      createdAt: { gte: dateFrom },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    _sum: { total: true },
    _count: true,
  });

  const revenue = revenueResult._sum.total ?? 0;
  const orders = revenueResult._count;

  // Profit share: sum of Commission where userId matches and type is CREATOR_SALE
  const commissionResult = await prisma.commission.aggregate({
    where: {
      userId: user.id,
      type: "CREATOR_SALE",
      createdAt: { gte: dateFrom },
    },
    _sum: { amount: true },
  });

  // Fall back to 10% of revenue if no commission records exist
  const profitShare = commissionResult._sum.amount ?? Number((revenue * 0.1).toFixed(2));

  return NextResponse.json({
    views,
    clicks,
    conversionRate,
    revenue: Number(revenue.toFixed(2)),
    profitShare: Number(profitShare.toFixed(2)),
    orders,
    period,
  });
}
