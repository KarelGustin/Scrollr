import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
import CartButtonInline from "@/components/feed/CartButtonInline";
import CategoryPills from "@/components/search/CategoryPills";
import type { FeedVideo } from "@/types";
import DiscoverFeedClient from "./DiscoverFeedClient";
import { getRankedFeedVideos } from "@/lib/feed-ranking";

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
    const cookieStore = await cookies();
    const viewerSessionId = cookieStore.get("cart_session")?.value ?? null;
    const user = await getUser();
    const [cats, videos] = await Promise.all([
      prisma.category.findMany({
        where: { active: true },
        orderBy: { position: "asc" },
        select: { id: true, name: true, slug: true, description: true, imageUrl: true },
      }),
      getRankedFeedVideos({
        viewerSessionId,
        viewerUserId: user?.id ?? null,
        limit: 30,
        category: activeCategory,
      }),
    ]);

    categories = cats;
    feedVideos = videos;
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
                : "No content yet. Check back soon!"}
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
    <DiscoverFeedClient
      initialVideos={feedVideos}
      categories={categories}
      activeCategory={activeCategory}
    />
  );
}
