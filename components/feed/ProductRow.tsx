"use client";

import type { FeedVideoProduct } from "@/types";

interface ProductRowProps {
  products: FeedVideoProduct[];
  onProductClick: (product: FeedVideoProduct) => void;
}

export default function ProductRow({ products, onProductClick }: ProductRowProps) {
  if (products.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-4">
      <div
        className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map((product) => (
          <button
            key={product.id}
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            className="flex-shrink-0 flex items-center gap-2.5 bg-bg/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 text-left transition-transform active:scale-95 max-w-[220px]"
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text truncate">
                {product.name}
              </p>
              {product.description && (
                <p className="text-[11px] text-muted truncate mt-0.5">{product.description}</p>
              )}
              {product.priceDisplay && (
                <p className="text-xs font-bold text-accent mt-0.5">
                  {product.priceDisplay}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
