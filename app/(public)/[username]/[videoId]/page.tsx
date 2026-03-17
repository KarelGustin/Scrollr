import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CreatorReelsViewer from "@/components/profile/CreatorReelsViewer";
import type { FeedVideo } from "@/types";

interface PageProps {
  params: Promise<{ username: string; videoId: string }>;
}

function normalizeUsername(rawUsername: string) {
  return rawUsername.startsWith("@") ? rawUsername.slice(1) : rawUsername;
}

async function getCreatorFeed(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      heightCm: true,
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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user || !user.username) {
    return null;
  }

  const feedVideos: FeedVideo[] = user.videos.map((video) => ({
    id: video.id,
    hlsUrl: video.hlsUrl!,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    user: {
      id: user.id,
      username: user.username!,
      name: user.name,
      avatarUrl: user.avatarUrl,
      heightCm: user.heightCm,
    },
    products: video.products
      .filter((vp) => (vp.product ? vp.product.published : vp.merchantProduct?.available))
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
          images: null,
          variants: null,
          creatorTaggedSize: vp.creatorTaggedSize ?? null,
          creatorHeightCm: user.heightCm ?? null,
        };
      }),
  }));

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      heightCm: user.heightCm,
    },
    feedVideos,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername, videoId } = await params;
  const username = normalizeUsername(rawUsername);
  const data = await getCreatorFeed(username);

  if (!data) return { title: "Not Found" };

  const videoIndex = data.feedVideos.findIndex((video) => video.id === videoId);
  if (videoIndex === -1) return { title: "Not Found" };

  const selectedVideo = data.feedVideos[videoIndex];
  const productNames = selectedVideo.products.map((product) => product.name).join(", ");
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
      ...(selectedVideo.thumbnailUrl
        ? { images: [{ url: selectedVideo.thumbnailUrl, width: 720, height: 1280 }] }
        : {}),
      ...(selectedVideo.hlsUrl
        ? {
            videos: [
              {
                url: selectedVideo.hlsUrl,
                type: "application/x-mpegURL",
                width: 720,
                height: 1280,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `@${data.user.username} on Scrollr`,
      description,
      ...(selectedVideo.thumbnailUrl ? { images: [selectedVideo.thumbnailUrl] } : {}),
    },
  };
}

export default async function SingleVideoPage({ params }: PageProps) {
  const { username: rawUsername, videoId } = await params;
  const username = normalizeUsername(rawUsername);
  const data = await getCreatorFeed(username);

  if (!data) notFound();

  const videoIndex = data.feedVideos.findIndex((video) => video.id === videoId);
  if (videoIndex === -1) notFound();

  return (
    <CreatorReelsViewer
      videos={data.feedVideos}
      creatorUsername={data.user.username}
      initialIndex={videoIndex}
      backHref={`/@${data.user.username}`}
    />
  );
}
