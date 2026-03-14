import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.merchantProduct.findMany({
    where: { merchantId: merchant.id },
    include: {
      _count: { select: { videoProducts: true, orderItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get per-product revenue
  const productIds = products.map((p) => p.id);
  const revenueData = await prisma.orderItem.groupBy({
    by: ["merchantProductId"],
    where: { merchantProductId: { in: productIds } },
    _sum: { total: true },
  });
  const revenueMap = new Map(revenueData.map((r) => [r.merchantProductId, r._sum.total ?? 0]));

  // Get video IDs for these products to count views and cart adds
  const videoProducts = await prisma.videoProduct.findMany({
    where: { merchantProductId: { in: productIds } },
    select: { merchantProductId: true, videoId: true },
  });

  const productVideoMap = new Map<string, string[]>();
  for (const vp of videoProducts) {
    if (vp.merchantProductId) {
      const existing = productVideoMap.get(vp.merchantProductId) ?? [];
      existing.push(vp.videoId);
      productVideoMap.set(vp.merchantProductId, existing);
    }
  }

  const allVideoIds = Array.from(new Set(videoProducts.map((vp) => vp.videoId)));

  const [viewEvents, cartEvents] = await Promise.all([
    prisma.event.groupBy({
      by: ["videoId"],
      where: { videoId: { in: allVideoIds }, type: "VIDEO_START" },
      _count: true,
    }),
    prisma.event.groupBy({
      by: ["videoId"],
      where: { videoId: { in: allVideoIds }, type: "ADD_TO_CART" },
      _count: true,
    }),
  ]);

  const viewMap = new Map(viewEvents.map((v) => [v.videoId, v._count]));
  const cartMap = new Map(cartEvents.map((v) => [v.videoId, v._count]));

  const enriched = products.map((p) => {
    const videoIds = productVideoMap.get(p.id) ?? [];
    const views = videoIds.reduce((sum, vid) => sum + (viewMap.get(vid) ?? 0), 0);
    const cartAdds = videoIds.reduce((sum, vid) => sum + (cartMap.get(vid) ?? 0), 0);

    return {
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      price: p.price,
      available: p.available,
      videoCount: p._count.videoProducts,
      views,
      cartAdds,
      purchases: p._count.orderItems,
      revenue: revenueMap.get(p.id) ?? 0,
    };
  });

  return NextResponse.json({ products: enriched });
}
