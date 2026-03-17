"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedVideo } from "@/types";
import VideoFeed from "@/components/feed/VideoFeed";
import FeedLayout from "@/components/feed/FeedLayout";
import ContextPanel from "@/components/feed/ContextPanel";
import CartButtonInline from "@/components/feed/CartButtonInline";
import CheckoutSheet from "@/components/feed/CheckoutSheet";
import CategoryPills from "@/components/search/CategoryPills";
import type { FeedVideoProduct } from "@/types";

interface DiscoverFeedClientProps {
  initialVideos: FeedVideo[];
  categories: { id: string; name: string; slug: string; description: string | null; imageUrl: string | null }[];
  activeCategory: string | null;
}

export default function DiscoverFeedClient({
  initialVideos,
  categories,
  activeCategory,
}: DiscoverFeedClientProps) {
  const [checkoutProduct, setCheckoutProduct] = useState<{ product: FeedVideoProduct; size?: string } | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["discover-feed"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/feed?cursor=${pageParam}&limit=10`
        : `/api/feed?limit=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Feed fetch failed");
      return res.json() as Promise<{ items: FeedVideo[]; nextCursor: string | null }>;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: false, // We use SSR data first, only fetch more on scroll
  });

  // Merge SSR videos with any paginated data
  const paginatedVideos = data?.pages.flatMap((p) => p.items) ?? [];
  const allVideos = paginatedVideos.length > 0
    ? [...initialVideos, ...paginatedVideos.filter(v => !initialVideos.find(iv => iv.id === v.id))]
    : initialVideos;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleBuyNow = useCallback((product: FeedVideoProduct, size?: string) => {
    setCheckoutProduct({ product, size });
  }, []);

  return (
    <FeedLayout
      contextPanelSlot={<ContextPanel videos={allVideos} />}
    >
      {/* Floating header — inside feed column */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div
          className="pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,12px)+4px)] pb-1 pointer-events-auto">
            <div className="w-20" />
            <h1 className="text-base font-display font-bold text-white drop-shadow-lg tracking-widest">SCROLLR</h1>
            <div className="flex items-center w-20 justify-end -mr-2">
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

      <VideoFeed
        videos={allVideos}
        showBranding={false}
        showCreator
        hideCartButton
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage ?? allVideos.length >= 30}
      />

      {/* Checkout sheet overlay */}
      {checkoutProduct && (
        <CheckoutSheet
          product={checkoutProduct.product}
          selectedSize={checkoutProduct.size}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={() => setCheckoutProduct(null)}
        />
      )}
    </FeedLayout>
  );
}
