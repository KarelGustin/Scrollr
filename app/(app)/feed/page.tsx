"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import VideoFeed from "@/components/feed/VideoFeed";
import { Spinner } from "@/components/ui/Spinner";
import type { FeedVideo } from "@/types";

export default function FeedPage() {
  const { data: videos, isLoading } = useQuery<FeedVideo[]>({
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

  if (!videos?.length) {
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
            Follow creators to see their content here.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-full hover:bg-accent/90 transition-colors"
          >
            Discover Creators
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-display font-bold text-text">Following</h1>
        </div>
      </div>
      <VideoFeed videos={videos} showBranding={false} showCreator />
    </div>
  );
}
