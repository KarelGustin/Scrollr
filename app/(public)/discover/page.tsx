import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import VideoFeed from "@/components/feed/VideoFeed";
import CartButtonInline from "@/components/feed/CartButtonInline";
import CategoryPills from "@/components/search/CategoryPills";
import type { FeedVideo } from "@/types";

export const metadata: Metadata = {
  title: "Discover - Scrollr",
  description: "Discover shoppable video content from creators on Scrollr",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categoryParam = searchParams?.category;
  const activeCategory =
    typeof categoryParam === "string" && categoryParam ? categoryParam : null;

  let categories: { id: string; name: string; slug: string; description: string | null; imageUrl: string | null }[] = [];
  let feedVideos: FeedVideo[] = [];

  try {
    const [cats, videos] = await Promise.all([
      prisma.category.findMany({
        where: { active: true },
        orderBy: { position: "asc" },
        select: { id: true, name: true, slug: true, description: true, imageUrl: true },
      }),
      prisma.video.findMany({
        where: {
          status: "READY",
          published: true,
          hlsUrl: { not: null },
          products: {
            some: activeCategory
              ? {
                  product: {
                    published: true,
                    tags: { contains: activeCategory, mode: "insensitive" },
                  },
                }
              : {},
          },
        },
        include: {
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
      }),
    ]);

    categories = cats;

    feedVideos = videos.map((v) => ({
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
        .filter((vp) =>
          vp.product ? vp.product.published : vp.merchantProduct?.available,
        )
        .map((vp) => {
          const mp = vp.merchantProduct;
          const p = vp.product;
          const mpPrice = mp?.price ?? null;
          return {
            id: p?.id ?? mp?.id ?? vp.id,
            name: mp?.title ?? p?.name ?? "Unknown",
            brand: p?.brand ?? null,
            price: mpPrice ?? p?.price ?? null,
            priceDisplay:
              mpPrice != null
                ? `$${mpPrice.toFixed(2)}`
                : (p?.priceDisplay ?? null),
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
  } catch (error) {
    console.error("Discover page data fetch failed:", error);
  }

  if (feedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-display font-bold text-text">Discover</h1>
            <Link
              href="/search"
              className="p-2 -mr-2 text-muted hover:text-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </Link>
          </div>
          {categories.length > 0 && (
            <div className="px-4 pb-3">
              <CategoryPills categories={categories} activeSlug={activeCategory} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center px-4" style={{ minHeight: "calc(100vh - 120px)" }}>
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-text mb-2">
              {activeCategory ? "No videos in this category" : "No videos yet"}
            </h2>
            <p className="text-muted">
              {activeCategory
                ? "Try selecting a different category or browse all content."
                : "Be the first creator to upload shoppable content!"}
            </p>
            {activeCategory && (
              <Link
                href="/discover"
                className="inline-block mt-4 px-5 py-2 bg-accent text-accent-fg rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                View all
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Floating header — transparent, over video */}
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-30 pointer-events-none">
        <div
          className="pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-1 pointer-events-auto">
            <h1 className="text-base font-display font-bold text-white drop-shadow-lg">Discover</h1>
            <div className="flex items-center -mr-2">
              <Link
                href="/search"
                className="p-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </Link>
              <CartButtonInline />
            </div>
          </div>
          {categories.length > 0 && (
            <div className="px-4 pb-3 pointer-events-auto">
              <CategoryPills categories={categories} activeSlug={activeCategory} floating />
            </div>
          )}
        </div>
      </div>

      <VideoFeed videos={feedVideos} showBranding={false} showCreator creatorTopClass="top-[100px]" hideCartButton />
    </div>
  );
}
