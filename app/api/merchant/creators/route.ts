import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find creators who tagged this merchant's products via VideoProduct → Video → User
  const videoProducts = await prisma.videoProduct.findMany({
    where: { merchantProduct: { merchantId: merchant.id } },
    include: {
      video: {
        select: {
          id: true,
          userId: true,
          user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true } },
        },
      },
    },
  });

  // Group by creator
  const creatorMap = new Map<string, {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    email: string;
    videoIds: Set<string>;
  }>();

  for (const vp of videoProducts) {
    const user = vp.video.user;
    if (!creatorMap.has(user.id)) {
      creatorMap.set(user.id, {
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        email: user.email,
        videoIds: new Set(),
      });
    }
    creatorMap.get(user.id)!.videoIds.add(vp.video.id);
  }

  // Get revenue per creator and views
  const creatorIds = Array.from(creatorMap.keys());

  const [revenueData, viewData] = await Promise.all([
    prisma.order.groupBy({
      by: ["creatorId"],
      where: { merchantId: merchant.id, creatorId: { in: creatorIds } },
      _sum: { total: true },
    }),
    prisma.event.groupBy({
      by: ["videoId"],
      where: {
        videoId: { in: Array.from(new Set(videoProducts.map((vp) => vp.video.id))) },
        type: "VIDEO_START",
      },
      _count: true,
    }),
  ]);

  const revenueMap = new Map(revenueData.map((r) => [r.creatorId, r._sum.total ?? 0]));
  const viewMap = new Map(viewData.map((v) => [v.videoId, v._count]));

  const creators = Array.from(creatorMap.values()).map((c) => {
    const totalViews = Array.from(c.videoIds).reduce((sum, vid) => sum + (viewMap.get(vid) ?? 0), 0);
    return {
      id: c.id,
      name: c.name,
      username: c.username,
      avatarUrl: c.avatarUrl,
      email: c.email,
      revenue: revenueMap.get(c.id) ?? 0,
      postCount: c.videoIds.size,
      totalViews,
    };
  });

  return NextResponse.json({ creators });
}
