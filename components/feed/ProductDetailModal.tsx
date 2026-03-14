"use client";

import { useEffect, useRef, useState } from "react";
import type { FeedVideoProduct } from "@/types";

interface ProductDetailModalProps {
  product: FeedVideoProduct | null;
  onClose: () => void;
  onAddToCart: (product: FeedVideoProduct, selectedSize?: string) => void;
  onShopNow: (product: FeedVideoProduct) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onShopNow,
}: ProductDetailModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeRequired, setSizeRequired] = useState(false);

  // Determine available sizes from variants or sizes array
  const availableSizes = product?.variants
    ? product.variants
        .filter((v) => v.available)
        .map((v) => v.title)
    : product?.sizes ?? [];

  const hasSizes = availableSizes && availableSizes.length > 0;

  // Stock status
  const getStockStatus = () => {
    if (!product) return null;

    // If variants exist and a size is selected, check that variant
    if (product.variants && selectedSize) {
      const variant = product.variants.find((v) => v.title === selectedSize);
      if (variant) {
        if (!variant.available || variant.inventoryQuantity === 0) return "out";
        if (variant.inventoryQuantity !== null && variant.inventoryQuantity < 5) return "low";
        return "in";
      }
    }

    // Fall back to product-level inventory
    if (product.inventoryQuantity !== null) {
      if (product.inventoryQuantity === 0) return "out";
      if (product.inventoryQuantity < 5) return "low";
      return "in";
    }

    return null; // Unknown / not tracked
  };

  const stockStatus = product ? getStockStatus() : null;

  // Reset state when product changes
  useEffect(() => {
    setSelectedSize(null);
    setAddedToCart(false);
    setSizeRequired(false);
  }, [product?.id]);

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

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setSizeRequired(true);
      return;
    }
    setSizeRequired(false);
    setAddedToCart(true);
    onAddToCart(product, selectedSize ?? undefined);

    // Reset confirmation after animation
    setTimeout(() => setAddedToCart(false), 1200);
  };

  const displayBrand = product.vendor || product.brand;
  const storeUrl = product.merchantUrl || product.affiliateUrl;

  // Format compare-at price
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        <div className="flex gap-4">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-28 h-28 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-text">
              {product.name}
            </h3>
            {displayBrand && (
              <p className="text-sm text-muted mt-0.5">{displayBrand}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {product.priceDisplay && (
                <p className="text-xl font-bold text-accent">
                  {product.priceDisplay}
                </p>
              )}
              {product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price && (
                <p className="text-sm text-muted line-through">
                  {formatPrice(product.compareAtPrice)}
                </p>
              )}
            </div>

            {/* Stock indicator */}
            {stockStatus && (
              <div className="mt-1.5">
                {stockStatus === "in" && (
                  <span className="text-xs font-medium text-green-500">In Stock</span>
                )}
                {stockStatus === "low" && (
                  <span className="text-xs font-medium text-amber-500">Low Stock</span>
                )}
                {stockStatus === "out" && (
                  <span className="text-xs font-medium text-red-500">Out of Stock</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted mt-4 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Size picker */}
        {hasSizes && (
          <div className="mt-4">
            <p className={`text-xs font-medium mb-2 ${sizeRequired ? "text-red-500" : "text-muted"}`}>
              {sizeRequired ? "Please select a size" : "Select Size"}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSizes!.map((size) => {
                const isUnavailable = product.variants
                  ? !product.variants.find((v) => v.title === size)?.available
                  : false;

                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (isUnavailable) return;
                      setSelectedSize(size === selectedSize ? null : size);
                      setSizeRequired(false);
                    }}
                    disabled={isUnavailable}
                    className={`px-3.5 py-2 text-sm font-medium rounded-xl border transition-colors ${
                      isUnavailable
                        ? "border-border bg-card text-muted/40 cursor-not-allowed line-through"
                        : selectedSize === size
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-card text-text hover:border-text/20"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddToCart}
            disabled={stockStatus === "out" || addedToCart}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              addedToCart
                ? "bg-green-500 text-white"
                : stockStatus === "out"
                  ? "bg-muted/20 text-muted cursor-not-allowed"
                  : "bg-accent text-accent-fg hover:bg-accent/90"
            }`}
          >
            {addedToCart ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added!
              </>
            ) : stockStatus === "out" ? (
              "Out of Stock"
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
          <button
            onClick={() => onShopNow(product)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border text-text rounded-xl text-sm font-semibold hover:bg-surface transition-colors"
          >
            Visit Store
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
