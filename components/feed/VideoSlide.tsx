"use client";

import { useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import type { FeedProduct } from "@/types";
import ProductTag from "./ProductTag";

interface VideoSlideProps {
  product: FeedProduct;
  isActive: boolean;
  index: number;
}

export default function VideoSlide({ product, isActive, index }: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hasStartedRef = useRef(false);

  // Set up HLS playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = product.video.hlsUrl;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [product.video.hlsUrl]);

  // Play/pause based on isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      hasStartedRef.current = false;
    }
  }, [isActive]);

  const handlePlay = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ type: "VIDEO_START", productId: product.id }]),
      }).catch(() => {});
    }
  }, [product.id]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Don't toggle if clicking inside the ProductTag area
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
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
        poster={product.video.thumbnailUrl ?? undefined}
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

      {/* Product info */}
      <ProductTag product={product} />
    </div>
  );
}
