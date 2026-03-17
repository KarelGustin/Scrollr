"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import VideoFeed from "@/components/feed/VideoFeed";
import FeedLayout from "@/components/feed/FeedLayout";
import ContextPanel from "@/components/feed/ContextPanel";
import CartButtonInline from "@/components/feed/CartButtonInline";
import { Spinner } from "@/components/ui/Spinner";
import type { FeedVideo } from "@/types";

interface ConsumerFeedResponse {
  videos: FeedVideo[];
  suggested: boolean;
}

export default function FeedPage() {
  const { data, isLoading } = useQuery<ConsumerFeedResponse>({
    queryKey: ["following-feed"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/feed");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  const videos = data?.videos ?? [];
  const suggested = data?.suggested ?? false;

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold text-text mb-2">
            Your feed is empty
          </h2>
          <p className="text-sm text-muted mb-6">
            Follow stores to see their content here.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-full hover:bg-accent/90 transition-colors"
          >
            Discover Stores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FeedLayout
      contextPanelSlot={<ContextPanel videos={videos} />}
    >
      {/* Floating header — inside feed column */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div
          className="pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,12px)+4px)] pb-3 pointer-events-auto">
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
          {suggested && (
            <div className="px-4 pb-2 pointer-events-auto">
              <p className="text-xs text-white/60 text-center">
                Suggested for you &middot; Follow stores to personalize
              </p>
            </div>
          )}
        </div>
      </div>
      <VideoFeed videos={videos} showBranding={false} showCreator hideCartButton />
    </FeedLayout>
  );
}
