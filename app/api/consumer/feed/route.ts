import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeedVideo } from "@/types";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get IDs of users this person follows
  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return NextResponse.json([]);
  }

  const videos = await prisma.video.findMany({
    where: {
      userId: { in: followingIds },
      status: "READY",
      published: true,
      hlsUrl: { not: null },
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
              description: true,
              sizes: true,
              published: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const feedVideos: FeedVideo[] = videos.map((v) => ({
    id: v.id,
    hlsUrl: v.hlsUrl!,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    user: {
      username: v.user.username ?? "anonymous",
      name: v.user.name,
      avatarUrl: v.user.avatarUrl,
    },
    products: v.products
      .filter((vp) => vp.product.published)
      .map((vp) => ({
        id: vp.product.id,
        name: vp.product.name,
        brand: vp.product.brand,
        price: vp.product.price,
        priceDisplay: vp.product.priceDisplay,
        imageUrl: vp.product.imageUrl,
        affiliateUrl: vp.product.affiliateUrl,
        description: vp.product.description,
        sizes: (vp.product.sizes as string[] | null) ?? null,
      })),
  }));

  return NextResponse.json(feedVideos);
}
