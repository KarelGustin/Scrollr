"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { FeedVideo, FeedVideoProduct } from "@/types";
import ProductCard from "./ProductCard";

interface VideoPlayerModalProps {
  video: FeedVideo;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});

  // Set up HLS
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = video.hlsUrl;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, startLevel: -1 });
      hls.loadSource(video.hlsUrl);
      hls.attachMedia(el);
      hlsRef.current = hls;
    }

    el.play().catch(() => {});

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video.hlsUrl]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleAddToCart = (product: FeedVideoProduct) => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ type: "ADD_TO_CART", productId: product.id }]),
    }).catch(() => {});

    // Add to cart - use merchantProductId if available, otherwise legacy productId
    const cartBody = product.merchantProductId
      ? { merchantProductId: product.merchantProductId, selectedSize: selectedSize[product.id] }
      : { productId: product.id };

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartBody),
    }).catch(() => {});
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("[data-products]")) return;

    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-30 p-2 text-white/80 hover:text-white transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Scrollr watermark */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="text-[11px] font-bold text-white/50 tracking-widest drop-shadow-md">
          SCROLLR
        </span>
      </div>

      {/* Creator info */}
      <div className="absolute top-4 left-12 z-20 flex items-center gap-2">
        {video.user.avatarUrl ? (
          <img src={video.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {(video.user.name ?? video.user.username).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-sm font-semibold text-white drop-shadow-md">@{video.user.username}</span>
      </div>

      {/* Video */}
      <div className="h-full w-full" onClick={handleTap}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={video.thumbnailUrl ?? undefined}
          muted
          playsInline
          loop
        />
      </div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)" }}
      />

      {/* Product cards at bottom */}
      {video.products.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20" data-products>
          {/* Toggle button */}
          <button
            onClick={() => setShowProducts(!showProducts)}
            className="flex items-center gap-2 mx-4 mb-2 px-3 py-2 bg-white/15 backdrop-blur-md rounded-xl text-white text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="16" y1="10" x2="16" y2="10" />
              <line x1="8" y1="10" x2="8" y2="10" />
            </svg>
            {video.products.length} product{video.products.length !== 1 ? "s" : ""}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showProducts ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Product cards (expandable) */}
          {showProducts && (
            <div className="bg-bg/95 backdrop-blur-xl border-t border-border max-h-[60vh] overflow-y-auto pb-safe">
              <div className="p-4 space-y-3">
                {video.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selectedSize={selectedSize[product.id]}
                    onSelectSize={(size) => setSelectedSize((prev) => ({ ...prev, [product.id]: size }))}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
