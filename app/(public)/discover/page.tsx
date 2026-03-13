import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import VideoFeed from "@/components/feed/VideoFeed";
import type { FeedVideo } from "@/types";

export const metadata: Metadata = {
  title: "Discover - Scrollr",
  description: "Discover shoppable video content from creators on Scrollr",
};

export default async function DiscoverPage() {
  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      published: true,
      hlsUrl: { not: null },
      products: { some: {} },
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
      })),
  }));

  if (feedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-text mb-2">
            No videos yet
          </h1>
          <p className="text-muted">
            Be the first creator to upload shoppable content!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <VideoFeed videos={feedVideos} showBranding={false} showCreator />
    </div>
  );
}
