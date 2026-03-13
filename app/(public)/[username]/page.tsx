import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUserPlan, showBranding } from "@/lib/planLimits";
import VideoFeed from "@/components/feed/VideoFeed";
import type { FeedVideo } from "@/types";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getUser(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      videos: {
        where: {
          status: "READY",
          published: true,
          hlsUrl: { not: null },
        },
        include: {
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
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUser(username);

  if (!user) {
    return { title: "Not Found" };
  }

  const firstVideo = user.videos[0];
  const thumbnail = firstVideo?.thumbnailUrl ?? undefined;

  const desc = user.bio ?? `Check out @${user.username}'s shoppable video feed on Scrollr`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scrollr.io";

  return {
    title: `@${user.username} on Scrollr`,
    description: desc,
    openGraph: {
      title: `@${user.username} on Scrollr`,
      description: desc,
      url: `${appUrl}/@${user.username}`,
      siteName: "Scrollr",
      type: "profile",
      ...(thumbnail ? { images: [{ url: thumbnail, width: 640, height: 360 }] } : {}),
    },
    twitter: {
      card: thumbnail ? "summary_large_image" : "summary",
      title: `@${user.username} on Scrollr`,
      description: desc,
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
  };
}

export default async function UserFeedPage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUser(username);

  if (!user) {
    notFound();
  }

  const plan = await getUserPlan(user.id);
  const branded = showBranding(plan);

  // Transform to FeedVideo type
  const feedVideos: FeedVideo[] = user.videos.map((v) => ({
    id: v.id,
    hlsUrl: v.hlsUrl!,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    user: {
      username: user.username!,
      name: user.name,
      avatarUrl: user.avatarUrl,
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

  return (
    <div className="min-h-screen bg-bg">
      <VideoFeed videos={feedVideos} showBranding={branded} />

      {branded && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <a
            href="https://scrollr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-surface/80 backdrop-blur border border-border rounded-full text-xs text-muted hover:text-text transition-colors"
          >
            Made with Scrollr
          </a>
        </div>
      )}
    </div>
  );
}
