"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import Hls from "hls.js";
import type { FeedVideo, FeedVideoProduct } from "@/types";
import { useFeedStore } from "@/stores/feedStore";
import ProductRow from "./ProductRow";
import ShareButton from "./ShareButton";
import ReportButton from "./ReportButton";
import VideoFollowPill from "./VideoFollowPill";

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

  // Shared mute state
  const isMuted = useFeedStore((s) => s.isMuted);
  const toggleMute = useFeedStore((s) => s.toggleMute);

  // Mute icon animation
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const muteIconTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Long-press state
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const isLongPressing = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  // Set up HLS playback
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const src = video.hlsUrl;
    const isPlainVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src);

    if (isPlainVideo) {
      el.src = src;
    } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
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

  // Sync mute state to video element
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = isMuted;
  }, [isMuted]);

  // Play/pause based on isActive + track watch duration
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      watchStartRef.current = Date.now();
      el.muted = isMuted;
      el.play().catch(() => {});
    } else {
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
  }, [isActive, video.id, video.duration, isMuted]);

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

  // Tap = toggle mute with animated icon
  const handleTap = useCallback(() => {
    toggleMute();

    // Show mute/unmute icon animation
    setShowMuteIcon(true);
    if (muteIconTimeout.current) clearTimeout(muteIconTimeout.current);
    muteIconTimeout.current = setTimeout(() => setShowMuteIcon(false), 800);
  }, [toggleMute]);

  // Long press handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;

    isLongPressing.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      const el = videoRef.current;
      if (el && !el.paused) {
        el.pause();
        setIsPaused(true);
      }
    }, 300);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }

    if (isLongPressing.current) {
      // Was a long press — resume video
      isLongPressing.current = false;
      const el = videoRef.current;
      if (el && isActive) {
        el.play().catch(() => {});
        setIsPaused(false);
      }
    } else {
      // Was a short tap — toggle mute
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("a")) return;
      handleTap();
    }
  }, [isActive, handleTap]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
    if (isLongPressing.current) {
      isLongPressing.current = false;
      const el = videoRef.current;
      if (el && isActive) {
        el.play().catch(() => {});
        setIsPaused(false);
      }
    }
  }, [isActive]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (muteIconTimeout.current) clearTimeout(muteIconTimeout.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const hasProducts = video.products.length > 0;
  const creatorHref = `/@${video.user.username}`;

  return (
    <div
      className="relative h-[100dvh] w-full flex-shrink-0 bg-black overflow-hidden select-none"
      style={{ scrollSnapAlign: "start" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onContextMenu={(e) => e.preventDefault()}
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

      {/* Mute/unmute icon animation */}
      {showMuteIcon && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div
            className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            style={{ animation: "muteIconFade 0.8s ease-out forwards" }}
          >
            {isMuted ? (
              // Muted icon (speaker with X)
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              // Unmuted icon (speaker with waves)
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Hold-to-pause indicator */}
      {isPaused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </div>
        </div>
      )}

      {/* Right side actions — above product cards */}
      <div className={`absolute right-3 z-20 flex flex-col gap-3 ${hasProducts ? "bottom-[calc(160px+env(safe-area-inset-bottom,0px))] md:bottom-32" : "bottom-[calc(90px+env(safe-area-inset-bottom,0px))] md:bottom-20"}`}>
        <ShareButton
          url={video.user?.username ? `/@${video.user.username}/${video.id}` : `/discover`}
          title={`Check out this video on Scrollr`}
          videoUrl={video.hlsUrl}
        />
        <ReportButton videoId={video.id} />
      </div>

      {/* Creator info — bottom left, above product cards */}
      {showCreator && video.user && (
        <div className={`absolute left-4 z-20 flex items-center gap-2 ${hasProducts ? "bottom-[calc(160px+env(safe-area-inset-bottom,0px))] md:bottom-32" : "bottom-[calc(90px+env(safe-area-inset-bottom,0px))] md:bottom-20"}`}>
          <Link
            href={creatorHref}
            className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity"
            aria-label={`Open @${video.user.username}'s profile`}
          >
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
          </Link>
          <VideoFollowPill creatorId={video.user.id} />
        </div>
      )}

      {/* Product row */}
      <ProductRow products={video.products} onProductClick={onProductClick} />
    </div>
  );
}
