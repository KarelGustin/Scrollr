"use client";

import { useEffect, useRef, useCallback } from "react";
import type { FeedProduct } from "@/types";
import { useFeedStore } from "@/stores/feedStore";
import VideoSlide from "./VideoSlide";

interface VideoFeedProps {
  products: FeedProduct[];
  showBranding: boolean;
}

export default function VideoFeed({ products, showBranding }: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);

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

            // Fire SLIDE_VIEW event (fire-and-forget)
            const product = products[index];
            if (product) {
              fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([
                  { type: "SLIDE_VIEW", productId: product.id },
                ]),
              }).catch(() => {});
            }
          }
        }
      }
    },
    [currentIndex, setCurrentIndex, products]
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
  }, [handleSlideVisible, products]);

  return (
    <div
      ref={containerRef}
      className="h-[100svh] w-full overflow-y-scroll bg-black"
      style={{
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {products.map((product, index) => {
        // Render current slide + next 2 for preloading
        const isActive = index === currentIndex;
        const shouldRender = Math.abs(index - currentIndex) <= 2;

        return (
          <div key={product.id} data-slide-index={index}>
            {shouldRender ? (
              <VideoSlide
                product={product}
                isActive={isActive}
                index={index}
              />
            ) : (
              <div className="h-[100svh] w-full bg-black" />
            )}
          </div>
        );
      })}
    </div>
  );
}
