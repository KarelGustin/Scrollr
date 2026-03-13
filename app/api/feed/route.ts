import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      published: true,
      hlsUrl: { not: null },
      products: { some: {} }, // Must have at least one tagged product
    },
    include: {
      user: {
        select: { username: true, name: true, avatarUrl: true },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              price: true,
              priceDisplay: true,
              imageUrl: true,
              affiliateUrl: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = videos.length > limit;
  const items = hasMore ? videos.slice(0, limit) : videos;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const feed = items.map((v) => ({
    id: v.id,
    hlsUrl: v.hlsUrl!,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    user: v.user,
    products: v.products.map((vp) => vp.product),
  }));

  return NextResponse.json({ items: feed, nextCursor });
}
