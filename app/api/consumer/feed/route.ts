import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeedVideo } from "@/types";

const videoInclude = {
  user: {
    select: { id: true, username: true, name: true, avatarUrl: true },
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
      merchantProduct: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          images: true,
          price: true,
          compareAtPrice: true,
          vendor: true,
          productUrl: true,
          inventoryQuantity: true,
          available: true,
        },
      },
    },
    orderBy: { position: "asc" as const },
  },
};

function mapVideos(videos: Awaited<ReturnType<typeof prisma.video.findMany>>): FeedVideo[] {
  return (videos as any[]).map((v) => ({
    id: v.id,
    hlsUrl: v.hlsUrl!,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    user: {
      id: v.user.id,
      username: v.user.username ?? "anonymous",
      name: v.user.name,
      avatarUrl: v.user.avatarUrl,
    },
    products: v.products
      .filter((vp: any) => vp.product ? vp.product.published : vp.merchantProduct?.available)
      .map((vp: any) => {
        const mp = vp.merchantProduct;
        const p = vp.product;
        return {
          id: p?.id ?? mp?.id ?? vp.id,
          name: mp?.title ?? p?.name ?? "Unknown",
          brand: p?.brand ?? null,
          price: mp?.price ?? p?.price ?? null,
          priceDisplay: mp ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(mp.price) : p?.priceDisplay ?? null,
          imageUrl: mp?.imageUrl ?? p?.imageUrl ?? null,
          affiliateUrl: p?.affiliateUrl ?? mp?.productUrl ?? "",
          description: mp?.description ?? p?.description ?? null,
          images: (mp?.images as string[] | null) ?? null,
          sizes: (p?.sizes as string[] | null) ?? null,
          merchantProductId: mp?.id ?? null,
          merchantUrl: mp?.productUrl ?? null,
          vendor: mp?.vendor ?? null,
          inventoryQuantity: mp?.inventoryQuantity ?? null,
          compareAtPrice: mp?.compareAtPrice ?? null,
          variants: null,
        };
      }),
  }));
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get IDs of users this person follows
  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);

  let suggested = false;

  if (followingIds.length > 0) {
    const videos = await prisma.video.findMany({
      where: {
        userId: { in: followingIds },
        status: "READY",
        published: true,
        hlsUrl: { not: null },
      },
      include: videoInclude,
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    if (videos.length > 0) {
      return NextResponse.json({ videos: mapVideos(videos), suggested: false });
    }
  }

  // Fallback: show discovery videos ranked by score
  suggested = true;
  const fallbackVideos = await prisma.video.findMany({
    where: {
      status: "READY",
      published: true,
      hlsUrl: { not: null },
      products: { some: {} },
    },
    include: {
      ...videoInclude,
      score: true,
    },
    take: 30,
  });

  // Sort by score descending
  fallbackVideos.sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0));

  return NextResponse.json({ videos: mapVideos(fallbackVideos), suggested });
}
