"use client";

import { useEffect, useRef, useCallback, useState, useLayoutEffect } from "react";
import type { FeedVideo, FeedVideoProduct } from "@/types";
import { useFeedStore } from "@/stores/feedStore";
import { useCartStore } from "@/stores/cartStore";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/lib/auth-context";
import VideoSlide from "./VideoSlide";
import ProductDetailModal from "./ProductDetailModal";
import CartDrawer from "./CartDrawer";
import CartButton from "./CartButton";
import AuthGateOverlay from "./AuthGateOverlay";

const ANON_VIEW_LIMIT = 10;
const STORAGE_KEY = "scrollr_view_count";

interface VideoFeedProps {
  videos: FeedVideo[];
  showBranding: boolean;
  showCreator?: boolean;
  allowAnonymous?: boolean;
  hideCartButton?: boolean;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export default function VideoFeed({
  videos,
  showBranding,
  showCreator = false,
  allowAnonymous = false,
  hideCartButton = false,
  initialIndex = 0,
  onIndexChange,
}: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);
  const [selectedProduct, setSelectedProduct] = useState<FeedVideoProduct | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const viewedVideosRef = useRef<Set<string>>(new Set());
  const addToCart = useAddToCart();
  const isCartOpen = useCartStore((s) => s.isOpen);
  const { status } = useAuth();
  const safeInitialIndex = Math.max(0, Math.min(initialIndex, Math.max(videos.length - 1, 0)));

  // Lock html/body scroll on mount
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Reset feed position when opening a new feed or deep link.
  useLayoutEffect(() => {
    if (videos.length === 0) {
      setCurrentIndex(0);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    setCurrentIndex(safeInitialIndex);
    container.scrollTop = container.clientHeight * safeInitialIndex;
  }, [safeInitialIndex, setCurrentIndex, videos.length]);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  // Fire PAGE_VIEW on mount
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ type: "PAGE_VIEW" }]),
    }).catch(() => {});
  }, []);

  // Initialize viewed videos from localStorage for anonymous users
  useEffect(() => {
    if (status === "unauthenticated" && allowAnonymous) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          viewedVideosRef.current = new Set(parsed);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [status, allowAnonymous]);

  // Track unique video views for unauthenticated users
  useEffect(() => {
    if (status !== "unauthenticated" || !allowAnonymous || showAuthGate) return;

    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    const viewed = viewedVideosRef.current;
    if (!viewed.has(currentVideo.id)) {
      viewed.add(currentVideo.id);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(viewed)));
      } catch {
        // Ignore localStorage errors
      }

      // Check if limit reached
      if (viewed.size >= ANON_VIEW_LIMIT) {
        setShowAuthGate(true);
      }
    }
  }, [currentIndex, status, allowAnonymous, showAuthGate, videos]);

  // IntersectionObserver to detect current visible slide
  const handleSlideVisible = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const index = Number(
            (entry.target as HTMLElement).dataset.slideIndex
          );
          if (!isNaN(index) && index !== currentIndex) {
            setCurrentIndex(index);
          }
        }
      }
    },
    [currentIndex, setCurrentIndex]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleSlideVisible, {
      root: container,
      threshold: 0.5,
    });

    const slides = container.querySelectorAll("[data-slide-index]");
    slides.forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, [handleSlideVisible, videos]);

  const handleProductClick = (product: FeedVideoProduct) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: FeedVideoProduct, selectedSize?: string) => {
    if (product.merchantProductId) {
      addToCart.mutate({ merchantProductId: product.merchantProductId, selectedSize });
    } else {
      addToCart.mutate({ productId: product.id });
    }
    setSelectedProduct(null);

    // Fire ADD_TO_CART event
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ type: "ADD_TO_CART", productId: product.id }]),
    }).catch(() => {});
  };

  const handleShopNow = (product: FeedVideoProduct) => {
    // Fire SHOP_CLICK event
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ type: "SHOP_CLICK", productId: product.id }]),
    }).catch(() => {});

    const url = product.merchantUrl || `/r/${product.id}`;
    window.open(url, "_blank");
    setSelectedProduct(null);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="h-[100dvh] w-full overflow-y-scroll bg-black"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          ...(showAuthGate ? { overflow: "hidden" } : {}),
        }}
      >
        {videos.map((video, index) => {
          const isActive = index === currentIndex;
          const shouldRender = Math.abs(index - currentIndex) <= 2;

          return (
            <div key={video.id} data-slide-index={index}>
              {shouldRender ? (
                <VideoSlide
                  video={video}
                  isActive={isActive}
                  index={index}
                  showCreator={showCreator}
                  onProductClick={handleProductClick}
                />
              ) : (
                <div className="h-[100dvh] w-full bg-black" />
              )}
            </div>
          );
        })}
      </div>

      {/* Cart button */}
      {!hideCartButton && <CartButton />}

      {/* Cart drawer */}
      {isCartOpen && <CartDrawer />}

      {/* Product detail modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onShopNow={handleShopNow}
      />

      {/* Auth gate for unauthenticated users who hit the scroll limit */}
      {showAuthGate && <AuthGateOverlay />}

      {/* Note: Save endpoints (/api/saved) already require auth via middleware protection.
          The handleAddToCart function works for anonymous users since cart is session-based. */}
    </>
  );
}
