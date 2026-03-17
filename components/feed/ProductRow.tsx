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
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-[calc(70px+env(safe-area-inset-bottom,0px))] md:pb-7 lg:hidden">
      <div
        className="flex gap-2.5 px-4 pb-1.5 overflow-x-auto scrollbar-hide"
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
              className="flex-shrink-0 group flex items-center gap-2.5 bg-[#171411]/68 backdrop-blur-xl border border-white/[0.12] rounded-2xl px-2.5 py-2 pr-3 text-left transition-all active:scale-[0.985] max-w-[226px] shadow-[0_16px_30px_-22px_rgba(0,0,0,0.78)]"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-15 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/8"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-display font-semibold tracking-[-0.02em] text-white truncate leading-tight">
                  {product.name}
                </p>
                {displayBrand && (
                  <p className="text-[9px] uppercase tracking-[0.14em] text-white/78 truncate mt-0.5">
                    {displayBrand}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {product.price != null && (
                    <span className="text-xs font-semibold text-white">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  {product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price && (
                    <span className="text-[9px] uppercase tracking-[0.12em] text-white/56 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  {fitNote ? (
                    <p className="text-[9px] text-white/84 truncate">
                      {fitNote}
                    </p>
                  ) : (
                    <div />
                  )}
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/90">
                    Tap to view
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
