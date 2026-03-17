import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CreatorProfile from "@/components/profile/CreatorProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

function normalizeUsername(rawUsername: string) {
  return rawUsername.startsWith("@") ? rawUsername.slice(1) : rawUsername;
}

async function getCreator(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
      videos: {
        where: {
          status: "READY",
          published: true,
          hlsUrl: { not: null },
        },
        select: {
          id: true,
          thumbnailUrl: true,
          hlsUrl: true,
          duration: true,
          createdAt: true,
          _count: {
            select: {
              events: { where: { type: "VIDEO_START" } },
            },
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
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const user = await getCreator(username);

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

export default async function CreatorProfilePage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const creator = await getCreator(username);

  if (!creator) {
    notFound();
  }

  const profileData = {
    id: creator.id,
    username: creator.username!,
    name: creator.name,
    avatarUrl: creator.avatarUrl,
    bio: creator.bio,
    followersCount: creator._count.followers,
    followingCount: creator._count.following,
    videosCount: creator.videos.length,
    videos: creator.videos.map((v) => ({
      id: v.id,
      thumbnailUrl: v.thumbnailUrl,
      hlsUrl: v.hlsUrl!,
      duration: v.duration,
      viewCount: v._count.events,
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
            images: null,
            variants: null,
          };
        }),
    })),
  };

  return <CreatorProfile creator={profileData} />;
}
