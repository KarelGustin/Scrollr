"use client";

import type { FeedVideoProduct } from "@/types";

interface ProductCardProps {
  product: FeedVideoProduct;
  selectedSize?: string;
  onSelectSize: (size: string) => void;
  onAddToCart: () => void;
}

export default function ProductCard({ product, selectedSize, onSelectSize, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Product image */}
        {product.imageUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
          </a>
        )}

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <h3 className="text-sm font-semibold text-text truncate">{product.name}</h3>
          </a>
          {product.brand && (
            <p className="text-xs text-muted mt-0.5">{product.brand}</p>
          )}
          {product.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
          )}
          {product.priceDisplay && (
            <p className="text-sm font-bold text-accent mt-1.5">{product.priceDisplay}</p>
          )}
        </div>
      </div>

      {/* Sizes */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted mr-1">Size:</span>
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => onSelectSize(size)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  selectedSize === size
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted hover:text-text hover:border-text/20"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add to cart + Visit store */}
      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={onAddToCart}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors active:scale-[0.98]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
          Add to Cart
        </button>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 px-4 py-2.5 bg-surface border border-border text-sm font-medium text-text rounded-xl hover:bg-surface/80 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Store
        </a>
      </div>
    </div>
  );
}
