"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeedVideoProduct } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";

interface ProductDetailModalProps {
  product: FeedVideoProduct | null;
  onClose: () => void;
  onAddToCart: (product: FeedVideoProduct, selectedSize?: string) => void;
  onShopNow: (product: FeedVideoProduct) => void;
  onBuyNow?: (product: FeedVideoProduct, selectedSize?: string) => void;
}

interface UgcVideo {
  id: string;
  thumbnailUrl: string | null;
  hlsUrl: string | null;
  title: string | null;
  user: {
    username: string;
    avatarUrl: string | null;
  };
  score: number;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onShopNow,
  onBuyNow,
}: ProductDetailModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeRequired, setSizeRequired] = useState(false);
  const [ugcVideos, setUgcVideos] = useState<UgcVideo[]>([]);
  const [loadingUgc, setLoadingUgc] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const touchStartX = useRef(0);
  const { status } = useAuth();

  // Determine available sizes from variants or sizes array
  const availableSizes = product?.variants
    ? product.variants
        .filter((v) => v.available)
        .map((v) => v.title)
    : product?.sizes ?? [];

  const hasSizes = availableSizes && availableSizes.length > 0;

  // Image list: use images array if available, fall back to imageUrl
  const imageList = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : [];

  // Stock status
  const getStockStatus = () => {
    if (!product) return null;

    if (product.variants && selectedSize) {
      const variant = product.variants.find((v) => v.title === selectedSize);
      if (variant) {
        if (!variant.available || variant.inventoryQuantity === 0) return "out";
        if (variant.inventoryQuantity !== null && variant.inventoryQuantity < 5) return "low";
        return "in";
      }
    }

    if (product.inventoryQuantity !== null) {
      if (product.inventoryQuantity === 0) return "out";
      if (product.inventoryQuantity < 5) return "low";
      return "in";
    }

    return null;
  };

  const stockStatus = product ? getStockStatus() : null;

  // Reset state when product changes
  useEffect(() => {
    setSelectedSize(null);
    setAddedToCart(false);
    setSizeRequired(false);
    setCurrentImageIndex(0);
    setUgcVideos([]);
    setShowAuthPrompt(false);

    if (product?.merchantProductId) {
      setLoadingUgc(true);
      fetch(`/api/merchant-products/${product.merchantProductId}/ugc`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setUgcVideos(data);
        })
        .catch(() => {})
        .finally(() => setLoadingUgc(false));
    }
  }, [product?.id, product?.merchantProductId]);

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

  const requireAuth = (): boolean => {
    if (status !== "authenticated") {
      setShowAuthPrompt(true);
      return true;
    }
    return false;
  };

  const handleAddToCart = () => {
    // Cart is session-based, no auth required for adding items
    if (hasSizes && !selectedSize) {
      setSizeRequired(true);
      return;
    }
    setSizeRequired(false);
    setAddedToCart(true);
    onAddToCart(product, selectedSize ?? undefined);
    setTimeout(() => setAddedToCart(false), 1200);
  };

  const handleBuyNow = () => {
    // Buy Now also works for guests — they'll enter email at checkout
    if (hasSizes && !selectedSize) {
      setSizeRequired(true);
      return;
    }
    setSizeRequired(false);
    onBuyNow?.(product, selectedSize ?? undefined);
  };

  const displayBrand = product.vendor || product.brand;
  const storeUrl = product.merchantUrl || product.affiliateUrl;

  // Touch handlers for image carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImageIndex < imageList.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:p-6" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-surface border-t border-border rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto md:max-w-2xl md:max-h-[90vh] md:rounded-2xl md:border md:shadow-2xl"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 md:hidden" />

        {/* Auth prompt inline */}
        {showAuthPrompt && (
          <div className="mb-4 p-4 bg-card border border-border rounded-xl text-center">
            <p className="text-sm font-semibold text-text mb-1">Sign in to shop</p>
            <p className="text-xs text-muted mb-3">Create a free account to purchase products</p>
            <div className="flex gap-2">
              <Link
                href="/login"
                className="flex-1 py-2 text-sm font-medium text-text border border-border rounded-xl hover:bg-surface transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex-1 py-2 text-sm font-semibold text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors text-center"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {imageList.length > 0 && (
            <div
              className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={imageList[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="112px"
              />
              {/* Image counter */}
              {imageList.length > 1 && (
                <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {currentImageIndex + 1}/{imageList.length}
                </div>
              )}
              {/* Dot indicators for multiple images */}
              {imageList.length > 1 && (
                <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1">
                  {imageList.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-text">
              {product.name}
            </h3>
            {displayBrand && (
              <p className="text-sm text-muted mt-0.5">{displayBrand}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {product.price != null && (
                <p className="text-xl font-bold text-accent">
                  {formatPrice(product.price)}
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

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          {/* Buy Now — primary */}
          {onBuyNow && (
            <button
              onClick={handleBuyNow}
              disabled={stockStatus === "out"}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                stockStatus === "out"
                  ? "bg-muted/20 text-muted cursor-not-allowed"
                  : "bg-accent text-accent-fg hover:bg-accent/90"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Buy Now
            </button>
          )}

          {/* Add to Cart — secondary when Buy Now exists, primary otherwise */}
          <button
            onClick={handleAddToCart}
            disabled={stockStatus === "out" || addedToCart}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              addedToCart
                ? "bg-green-500 text-white"
                : stockStatus === "out"
                  ? "bg-muted/20 text-muted cursor-not-allowed"
                  : onBuyNow
                    ? "bg-card border border-border text-text hover:bg-surface"
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
            ) : stockStatus === "out" && !onBuyNow ? (
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
        </div>

        {/* Visit Store link */}
        {storeUrl && (
          <div className="mt-3 text-center">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
            >
              Visit Store
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}

        {/* UGC Section */}
        {(ugcVideos.length > 0 || loadingUgc) && (
          <div className="mt-6 border-t border-border pt-4">
            {loadingUgc && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                Loading featured videos...
              </div>
            )}
            {ugcVideos.length > 0 && (
              <div>
                <h3 className="text-sm font-display font-bold text-text mb-3">
                  Featured by Creators
                </h3>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {ugcVideos.map((video) => (
                    <Link
                      key={video.id}
                      href={`/@${video.user.username}/${video.id}`}
                      className="flex-shrink-0 group"
                    >
                      <div className="relative w-20 rounded-xl overflow-hidden bg-surface" style={{ aspectRatio: "9/16" }}>
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={`Video by ${video.user.username}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1.5 pt-4">
                          <p className="text-[10px] text-white font-medium truncate">
                            @{video.user.username}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
