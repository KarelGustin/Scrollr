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
  });

  if (!video) return null;

  return { user, video };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, videoId } = await params;
  const data = await getData(username, videoId);

  if (!data) return { title: "Not Found" };

  const productNames = data.video.products.map((vp) => vp.merchantProduct?.title ?? vp.product?.name ?? "").filter(Boolean).join(", ");
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
      ...(data.video.thumbnailUrl ? { images: [{ url: data.video.thumbnailUrl, width: 720, height: 1280 }] } : {}),
      ...(data.video.hlsUrl ? { videos: [{ url: data.video.hlsUrl, type: "application/x-mpegURL", width: 720, height: 1280 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
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
      id: data.user.id,
      username: data.user.username!,
      name: data.user.name,
      avatarUrl: data.user.avatarUrl,
    },
    products: data.video.products
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
          sizes: null,
          merchantProductId: mp?.id ?? null,
          merchantUrl: mp?.productUrl ?? null,
          vendor: mp?.vendor ?? null,
          inventoryQuantity: mp?.inventoryQuantity ?? null,
          compareAtPrice: mp?.compareAtPrice ?? null,
          variants: null,
        };
      }),
  };

  return (
    <div className="min-h-screen bg-bg">
      <VideoFeed videos={[feedVideo]} showBranding={false} showCreator />
    </div>
  );
}
