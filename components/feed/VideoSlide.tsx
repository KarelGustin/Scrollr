"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Hls from "hls.js";
import type { FeedVideo, FeedVideoProduct } from "@/types";
import ProductRow from "./ProductRow";
import ShareButton from "./ShareButton";
import ReportButton from "./ReportButton";

interface VideoSlideProps {
  video: FeedVideo;
  isActive: boolean;
  index: number;
  showCreator?: boolean;
  onProductClick: (product: FeedVideoProduct) => void;
}

export default function VideoSlide({
  video,
  isActive,
  index,
  showCreator = false,
  onProductClick,
}: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hasStartedRef = useRef(false);
  const watchStartRef = useRef<number>(0);

  // Set up HLS playback
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const src = video.hlsUrl;

    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
      });
      hls.loadSource(src);
      hls.attachMedia(el);
      hlsRef.current = hls;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video.hlsUrl]);

  // Play/pause based on isActive + track watch duration
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      watchStartRef.current = Date.now();
      el.play().catch(() => {});
    } else {
      // Fire watch duration when user scrolls away
      if (hasStartedRef.current) {
        const watchDuration = (Date.now() - watchStartRef.current) / 1000;
        const videoDuration = el.duration || video.duration || 1;
        const watchPercentage = Math.min(watchDuration / videoDuration, 1);

        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{
            type: "VIDEO_COMPLETE",
            videoId: video.id,
            metadata: { watchDuration, watchPercentage },
          }]),
        }).catch(() => {});
      }
      el.pause();
      hasStartedRef.current = false;
    }
  }, [isActive, video.id, video.duration]);

  const handlePlay = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ type: "VIDEO_START", videoId: video.id }]),
      }).catch(() => {});
    }
  }, [video.id]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;

    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  return (
    <div
      className="relative h-[100svh] w-full flex-shrink-0 bg-black overflow-hidden"
      style={{ scrollSnapAlign: "start" }}
      onClick={handleTap}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster={video.thumbnailUrl ?? undefined}
        autoPlay={isActive}
        muted
        playsInline
        loop
        onPlay={handlePlay}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)",
        }}
      />

      {/* Creator info */}
      {showCreator && video.user && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {video.user.avatarUrl ? (
            <img
              src={video.user.avatarUrl}
              alt={video.user.username}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border-2 border-white/20">
              <span className="text-xs font-medium text-muted">
                {(video.user.name ?? video.user.username ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-semibold text-white drop-shadow-md">
            @{video.user.username}
          </span>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col gap-3">
        <ShareButton
          url={video.user?.username ? `/@${video.user.username}/${video.id}` : `/discover`}
          title={`Check out this video on Scrollr`}
        />
        <ReportButton videoId={video.id} />
      </div>

      {/* Product row */}
      <ProductRow products={video.products} onProductClick={onProductClick} />
    </div>
  );
}
