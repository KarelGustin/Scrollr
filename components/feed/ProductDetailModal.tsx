"use client";

import { useEffect, useRef } from "react";
import type { FeedVideoProduct } from "@/types";

interface ProductDetailModalProps {
  product: FeedVideoProduct | null;
  onClose: () => void;
  onAddToCart: (product: FeedVideoProduct) => void;
  onShopNow: (product: FeedVideoProduct) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onShopNow,
}: ProductDetailModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!product) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        <div className="flex gap-4">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-text">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-sm text-muted mt-0.5">{product.brand}</p>
            )}
            {product.priceDisplay && (
              <p className="text-lg font-bold text-accent mt-1">
                {product.priceDisplay}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border rounded-xl text-sm font-semibold text-text hover:bg-surface transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            Add to Cart
          </button>
          <button
            onClick={() => onShopNow(product)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Shop Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
