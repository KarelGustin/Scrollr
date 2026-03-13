import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import VideoFeed from "@/components/feed/VideoFeed";
import type { FeedVideo } from "@/types";

interface PageProps {
  params: Promise<{ username: string; videoId: string }>;
}

async function getData(username: string, videoId: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true, avatarUrl: true, bio: true },
  });

  if (!user) return null;

  const video = await prisma.video.findUnique({
    where: { id: videoId, userId: user.id, status: "READY", published: true },
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
              description: true,
              sizes: true,
              published: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!video) return null;

  return { user, video };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, videoId } = await params;
  const data = await getData(username, videoId);

  if (!data) return { title: "Not Found" };

  const productNames = data.video.products.map((vp) => vp.product.name).join(", ");
  const description = productNames
    ? `Shop ${productNames} from @${data.user.username} on Scrollr`
    : `Watch @${data.user.username}'s video on Scrollr`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scrollr.io";

  return {
    title: `@${data.user.username} on Scrollr`,
    description,
    openGraph: {
      title: `@${data.user.username} on Scrollr`,
      description,
      url: `${appUrl}/@${data.user.username}/${videoId}`,
      siteName: "Scrollr",
      type: "video.other",
      ...(data.video.thumbnailUrl ? { images: [{ url: data.video.thumbnailUrl, width: 640, height: 360 }] } : {}),
    },
    twitter: {
      card: data.video.thumbnailUrl ? "summary_large_image" : "summary",
      title: `@${data.user.username} on Scrollr`,
      description,
      ...(data.video.thumbnailUrl ? { images: [data.video.thumbnailUrl] } : {}),
    },
  };
}

export default async function SingleVideoPage({ params }: PageProps) {
  const { username, videoId } = await params;
  const data = await getData(username, videoId);

  if (!data) notFound();

  const feedVideo: FeedVideo = {
    id: data.video.id,
    hlsUrl: data.video.hlsUrl!,
    thumbnailUrl: data.video.thumbnailUrl,
    duration: data.video.duration,
    user: {
      username: data.user.username!,
      name: data.user.name,
      avatarUrl: data.user.avatarUrl,
    },
    products: data.video.products
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
  };

  return (
    <div className="min-h-screen bg-bg">
      <VideoFeed videos={[feedVideo]} showBranding={false} showCreator />
    </div>
  );
}
