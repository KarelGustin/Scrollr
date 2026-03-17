"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FeedVideo } from "@/types";
import VideoFeed from "@/components/feed/VideoFeed";

interface CreatorReelsViewerProps {
  videos: FeedVideo[];
  creatorUsername: string;
  initialIndex?: number;
  onClose?: () => void;
  backHref?: string;
}

export default function CreatorReelsViewer({
  videos,
  creatorUsername,
  initialIndex = 0,
  onClose,
  backHref,
}: CreatorReelsViewerProps) {
  const safeInitialIndex = useMemo(
    () => Math.max(0, Math.min(initialIndex, Math.max(videos.length - 1, 0))),
    [initialIndex, videos.length]
  );
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);

  if (videos.length === 0) {
    return null;
  }

  const shellClassName = onClose
    ? "fixed inset-0 z-[80] bg-black md:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.96)_65%)]"
    : "fixed inset-0 z-50 bg-black md:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.96)_65%)]";

  return (
    <div className={shellClassName}>
      <div className="absolute inset-x-0 top-0 z-40 pointer-events-none">
        <div className="mx-auto w-full md:max-w-[430px]">
          <div
            className="pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.32) 55%, transparent 100%)",
            }}
          >
            <div className="pointer-events-auto flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,12px)+2px)] pb-2">
              {onClose ? (
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-white/85 hover:text-white transition-colors"
                  aria-label="Close video viewer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              ) : (
                <Link
                  href={backHref ?? `/@${creatorUsername}`}
                  className="p-2 -ml-2 text-white/85 hover:text-white transition-colors"
                  aria-label="Back to profile"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </Link>
              )}

              <p className="text-sm font-semibold text-white drop-shadow-md">
                @{creatorUsername}
              </p>

              <div className="rounded-full bg-black/35 backdrop-blur-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/85">
                {activeIndex + 1}/{videos.length}
              </div>
            </div>

            <div className="pointer-events-none pb-2 text-center text-[11px] tracking-[0.04em] text-white/65">
              Swipe up or down to browse
            </div>
          </div>
        </div>
      </div>

      <VideoFeed
        videos={videos}
        showBranding={false}
        showCreator
        hideCartButton
        initialIndex={safeInitialIndex}
        onIndexChange={setActiveIndex}
      />
    </div>
  );
}
