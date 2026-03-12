import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUserPlan, showBranding } from "@/lib/planLimits";
import VideoFeed from "@/components/feed/VideoFeed";
import type { FeedProduct } from "@/types";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getUser(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: {
      products: {
        where: {
          published: true,
          video: { status: "READY" },
        },
        include: { video: true },
        orderBy: { position: "asc" },
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

  const firstProduct = user.products[0];
  const thumbnail = firstProduct?.video?.thumbnailUrl ?? undefined;

  return {
    title: `@${user.username} on Scrollr`,
    description: user.bio ?? `Check out @${user.username}'s shoppable video feed on Scrollr`,
    openGraph: {
      title: `@${user.username} on Scrollr`,
      description: user.bio ?? `Check out @${user.username}'s shoppable video feed on Scrollr`,
      ...(thumbnail ? { images: [{ url: thumbnail }] } : {}),
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

  // Transform Prisma products to FeedProduct type
  const feedProducts: FeedProduct[] = user.products
    .filter((p) => p.video !== null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      description: p.description,
      video: {
        hlsUrl: p.video!.hlsUrl ?? "",
        thumbnailUrl: p.video!.thumbnailUrl,
        duration: p.video!.duration,
      },
    }));

  return (
    <div className="min-h-screen bg-bg">
      <VideoFeed products={feedProducts} showBranding={branded} />

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
