"use client";

import type { FeedVideoProduct } from "@/types";

interface ProductRowProps {
  products: FeedVideoProduct[];
  onProductClick: (product: FeedVideoProduct) => void;
}

export default function ProductRow({ products, onProductClick }: ProductRowProps) {
  if (products.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-[calc(68px+env(safe-area-inset-bottom,0px))] md:pb-6">
      <div
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map((product) => {
          const displayBrand = product.vendor || product.brand;

          return (
            <button
              key={product.id}
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product);
              }}
              className="flex-shrink-0 group flex items-center gap-3 bg-black/50 backdrop-blur-xl border border-white/[0.12] rounded-2xl p-2.5 pr-4 text-left transition-all active:scale-[0.97] max-w-[260px] hover:bg-black/60 hover:border-white/20"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate leading-tight">
                  {product.name}
                </p>
                {displayBrand && (
                  <p className="text-[11px] text-white/50 truncate mt-0.5">
                    {displayBrand}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  {product.priceDisplay && (
                    <span className="text-sm font-bold text-white">
                      {product.priceDisplay}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent bg-accent/20 px-1.5 py-0.5 rounded-full">
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
