import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [orders, revenueAgg, topProductData, topCreatorData] = await Promise.all([
    prisma.order.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        buyerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.aggregate({
      where: { merchantId: merchant.id },
      _sum: { total: true, creatorCommission: true },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["merchantProductId"],
      where: { order: { merchantId: merchant.id } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 1,
    }),
    prisma.order.groupBy({
      by: ["creatorId"],
      where: { merchantId: merchant.id, creatorId: { not: null } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 1,
    }),
  ]);

  const totalRevenue = revenueAgg._sum.total ?? 0;
  const creatorPayouts = revenueAgg._sum.creatorCommission ?? 0;
  const totalOrders = revenueAgg._count;

  // Get video views for conversion rate estimate
  const videoProductCount = await prisma.videoProduct.count({
    where: { merchantProduct: { merchantId: merchant.id } },
  });
  const conversionRate = videoProductCount > 0 ? (totalOrders / videoProductCount) * 100 : 0;

  let topProduct = null;
  if (topProductData.length > 0) {
    const mp = await prisma.merchantProduct.findUnique({
      where: { id: topProductData[0].merchantProductId },
      select: { title: true },
    });
    topProduct = mp ? { title: mp.title, revenue: topProductData[0]._sum.total ?? 0 } : null;
  }

  let topCreator = null;
  if (topCreatorData.length > 0 && topCreatorData[0].creatorId) {
    const user = await prisma.user.findUnique({
      where: { id: topCreatorData[0].creatorId },
      select: { name: true, username: true },
    });
    topCreator = user
      ? { name: user.name ?? user.username ?? "Unknown", revenue: topCreatorData[0]._sum.total ?? 0 }
      : null;
  }

  return NextResponse.json({
    totalRevenue,
    creatorPayouts,
    totalOrders,
    conversionRate,
    recentOrders: orders,
    topProduct,
    topCreator,
  });
}
