"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { FeedVideo, FeedVideoProduct } from "@/types";
import { useFeedStore } from "@/stores/feedStore";
import { useCartStore } from "@/stores/cartStore";
import { useAddToCart } from "@/hooks/useCart";
import VideoSlide from "./VideoSlide";
import ProductDetailModal from "./ProductDetailModal";
import CartDrawer from "./CartDrawer";
import CartButton from "./CartButton";

interface VideoFeedProps {
  videos: FeedVideo[];
  showBranding: boolean;
  showCreator?: boolean;
}

export default function VideoFeed({ videos, showBranding, showCreator = false }: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);
  const [selectedProduct, setSelectedProduct] = useState<FeedVideoProduct | null>(null);
  const addToCart = useAddToCart();
  const isCartOpen = useCartStore((s) => s.isOpen);

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

  // Fire PAGE_VIEW on mount
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ type: "PAGE_VIEW" }]),
    }).catch(() => {});
  }, []);

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

  const handleAddToCart = (product: FeedVideoProduct) => {
    addToCart.mutate({ productId: product.id });
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

    window.open(`/r/${product.id}`, "_blank");
    setSelectedProduct(null);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="h-[100svh] w-full overflow-y-scroll bg-black"
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
                <div className="h-[100svh] w-full bg-black" />
              )}
            </div>
          );
        })}
      </div>

      {/* Cart button */}
      <CartButton />

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
