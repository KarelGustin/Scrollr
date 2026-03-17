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

interface VideoFeedProps {
  videos: FeedVideo[];
  showBranding: boolean;
  showCreator?: boolean;
  hideCartButton?: boolean;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function VideoFeed({
  videos,
  showBranding,
  showCreator = false,
  hideCartButton = false,
  initialIndex = 0,
  onIndexChange,
  onLoadMore,
  hasMore = false,
}: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);
  const [selectedProduct, setSelectedProduct] = useState<FeedVideoProduct | null>(null);
  const addToCart = useAddToCart();
  const isCartOpen = useCartStore((s) => s.isOpen);
  const { status } = useAuth();
  const safeInitialIndex = Math.max(0, Math.min(initialIndex, Math.max(videos.length - 1, 0)));
  const loadMoreCalledRef = useRef(false);

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

  // Infinite scroll: load more when near end
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    if (currentIndex >= videos.length - 3) {
      if (!loadMoreCalledRef.current) {
        loadMoreCalledRef.current = true;
        onLoadMore();
      }
    }
  }, [currentIndex, videos.length, hasMore, onLoadMore]);

  // Reset loadMore flag when videos change (new batch loaded)
  useEffect(() => {
    loadMoreCalledRef.current = false;
  }, [videos.length]);

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
    const currentVideo = videos[currentIndex];
    const videoId = currentVideo?.id;
    if (product.merchantProductId) {
      addToCart.mutate({ merchantProductId: product.merchantProductId, selectedSize, videoId });
    } else {
      addToCart.mutate({ productId: product.id, videoId });
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

        {/* Loading skeleton while fetching more */}
        {hasMore && (
          <div className="h-[100dvh] w-full bg-black flex items-center justify-center" data-slide-index={videos.length}>
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
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
    </>
  );
}
