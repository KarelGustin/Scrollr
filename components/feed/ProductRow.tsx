"use client";

import type { FeedVideoProduct } from "@/types";
import { formatPrice } from "@/lib/format";

interface ProductRowProps {
  products: FeedVideoProduct[];
  onProductClick: (product: FeedVideoProduct) => void;
}

export default function ProductRow({ products, onProductClick }: ProductRowProps) {
  if (products.length === 0) return null;

  const formatFitNote = (product: FeedVideoProduct) => {
    const parts = [];
    if (product.creatorHeightCm != null) {
      parts.push(`${product.creatorHeightCm} cm`);
    }
    if (product.creatorTaggedSize) {
      parts.push(`wears ${product.creatorTaggedSize}`);
    }
    return parts.length > 0 ? parts.join(" • ") : null;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-[calc(74px+env(safe-area-inset-bottom,0px))] md:pb-7 lg:hidden">
      <div
        className="flex gap-3 px-4 pb-2 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map((product) => {
          const displayBrand = product.vendor || product.brand;
          const fitNote = formatFitNote(product);

          return (
            <button
              type="button"
              key={product.id}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product);
              }}
              className="flex-shrink-0 group flex items-center gap-3 bg-[#171411]/70 backdrop-blur-xl border border-white/[0.12] rounded-xl p-3 pr-4 text-left transition-all active:scale-[0.97] max-w-[264px] shadow-[0_18px_36px_-26px_rgba(0,0,0,0.75)]"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-20 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg font-display font-semibold tracking-[-0.02em] text-white truncate leading-tight">
                  {product.name}
                </p>
                {displayBrand && (
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55 truncate mt-1">
                    {displayBrand}
                  </p>
                )}
                {fitNote && (
                  <p className="text-[10px] text-[#f3ebdf]/80 mt-1 truncate">
                    Fit guide: {fitNote}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  {product.price != null && (
                    <span className="text-sm font-semibold text-white">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  {product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price && (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/35 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f6f1e8] bg-white/10 px-2 py-1 rounded-md">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                    Shop
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
