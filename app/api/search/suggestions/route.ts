import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [trendingVideos, cartEvents, topCreators, topStores] = await Promise.all([
    // Trending videos by score
    prisma.video.findMany({
      where: {
        status: "READY",
        published: true,
        hlsUrl: { not: null },
      },
      include: {
        user: { select: { username: true, name: true, avatarUrl: true } },
        score: true,
      },
      take: 20,
    }),

    // Popular products by ADD_TO_CART count
    prisma.event.groupBy({
      by: ["productId"],
      where: { type: "ADD_TO_CART", productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 8,
    }),

    // Top creators by follower count
    prisma.user.findMany({
      where: { role: "CREATOR" },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
        _count: { select: { followers: true, videos: true } },
      },
      orderBy: { followers: { _count: "desc" } },
      take: 8,
    }),

    // Top stores by product count
    prisma.merchant.findMany({
      where: { active: true, slug: { not: null } },
      select: {
        id: true,
        slug: true,
        storeName: true,
        storeLogoUrl: true,
        _count: { select: { merchantProducts: true } },
      },
      orderBy: { merchantProducts: { _count: "desc" } },
      take: 8,
    }),
  ]);

  // Sort trending videos by score and take top 8
  const sortedVideos = trendingVideos
    .sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0))
    .slice(0, 8);

  const videos = sortedVideos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    user: {
      username: v.user.username,
      name: v.user.name,
      avatarUrl: v.user.avatarUrl,
    },
  }));

  // Fetch popular products
  const productIds = cartEvents
    .map((e) => e.productId)
    .filter((id): id is string => id !== null);

  const products = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds }, published: true },
        select: {
          id: true,
          name: true,
          brand: true,
          price: true,
          priceDisplay: true,
          imageUrl: true,
          affiliateUrl: true,
          user: { select: { username: true, name: true, avatarUrl: true } },
        },
      })
    : [];

  const creators = topCreators.map((c) => ({
    id: c.id,
    username: c.username,
    name: c.name,
    avatarUrl: c.avatarUrl,
    bio: c.bio,
    _count: { videos: c._count.videos, products: 0 },
  }));

  const merchants = topStores.map((m) => ({
    id: m.id,
    storeName: m.storeName,
    storeLogoUrl: m.storeLogoUrl,
    _count: { merchantProducts: m._count.merchantProducts },
  }));

  return NextResponse.json({ videos, products, creators, merchants });
}
