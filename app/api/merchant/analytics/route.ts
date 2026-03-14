import { NextRequest, NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30d";

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Revenue over time
  const orders = await prisma.order.findMany({
    where: { merchantId: merchant.id, createdAt: { gte: since } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const revenueByDay = new Map<string, number>();
  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + o.total);
  }
  const revenueOverTime = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({ date, revenue }));

  // Top products
  const topProductData = await prisma.orderItem.groupBy({
    by: ["merchantProductId"],
    where: { order: { merchantId: merchant.id, createdAt: { gte: since } } },
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 10,
  });

  const topProductIds = topProductData.map((p) => p.merchantProductId);
  const productNames = await prisma.merchantProduct.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, title: true },
  });
  const nameMap = new Map(productNames.map((p) => [p.id, p.title]));

  const topProducts = topProductData.map((p) => ({
    title: nameMap.get(p.merchantProductId) ?? "Unknown",
    revenue: p._sum.total ?? 0,
    views: 0,
  }));

  // Top creators
  const topCreatorData = await prisma.order.groupBy({
    by: ["creatorId"],
    where: { merchantId: merchant.id, creatorId: { not: null }, createdAt: { gte: since } },
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 10,
  });

  const creatorIds = topCreatorData
    .map((c) => c.creatorId)
    .filter((id): id is string => id !== null);
  const creatorNames = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true, username: true },
  });
  const creatorNameMap = new Map(creatorNames.map((u) => [u.id, u.name ?? u.username ?? "Unknown"]));

  const topCreators = topCreatorData.map((c) => ({
    name: creatorNameMap.get(c.creatorId!) ?? "Unknown",
    revenue: c._sum.total ?? 0,
  }));

  // Funnel: views, cart adds, purchases
  const merchantProductIds = await prisma.merchantProduct.findMany({
    where: { merchantId: merchant.id },
    select: { id: true },
  });
  const mpIds = merchantProductIds.map((p) => p.id);

  const videoProductEntries = await prisma.videoProduct.findMany({
    where: { merchantProductId: { in: mpIds } },
    select: { videoId: true },
  });
  const videoIds = Array.from(new Set(videoProductEntries.map((vp) => vp.videoId)));

  const [viewCount, cartCount, purchaseCount] = await Promise.all([
    prisma.event.count({
      where: { videoId: { in: videoIds }, type: "VIDEO_START", createdAt: { gte: since } },
    }),
    prisma.event.count({
      where: { videoId: { in: videoIds }, type: "ADD_TO_CART", createdAt: { gte: since } },
    }),
    prisma.order.count({
      where: { merchantId: merchant.id, createdAt: { gte: since } },
    }),
  ]);

  return NextResponse.json({
    topProducts,
    topCreators,
    revenueOverTime,
    funnel: { views: viewCount, cartAdds: cartCount, purchases: purchaseCount },
  });
}
