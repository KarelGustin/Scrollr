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
          merchantProduct: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              price: true,
              compareAtPrice: true,
              vendor: true,
              productUrl: true,
              inventoryQuantity: true,
              available: true,
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
      .filter((vp) => vp.product ? vp.product.published : vp.merchantProduct?.available)
      .map((vp) => {
        const mp = vp.merchantProduct;
        const p = vp.product;
        return {
          id: p?.id ?? mp?.id ?? vp.id,
          name: mp?.title ?? p?.name ?? "Unknown",
          brand: p?.brand ?? null,
          price: mp?.price ?? p?.price ?? null,
          priceDisplay: mp ? `$${mp.price.toFixed(2)}` : p?.priceDisplay ?? null,
          imageUrl: mp?.imageUrl ?? p?.imageUrl ?? null,
          affiliateUrl: p?.affiliateUrl ?? mp?.productUrl ?? "",
          description: mp?.description ?? p?.description ?? null,
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

  return NextResponse.json(feedVideos);
}
