"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeedVideoProduct } from "@/types";
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
  onBuyNow,
}: ProductDetailModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeRequired, setSizeRequired] = useState(false);
  const [ugcVideos, setUgcVideos] = useState<UgcVideo[]>([]);
  const [loadingUgc, setLoadingUgc] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);

  const availableSizes = product?.variants
    ? product.variants.filter((v) => v.available).map((v) => v.title)
    : product?.sizes ?? [];

  const hasSizes = availableSizes && availableSizes.length > 0;

  const imageList = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : [];

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

  useEffect(() => {
    setSelectedSize(null);
    setAddedToCart(false);
    setSizeRequired(false);
    setCurrentImageIndex(0);
    setUgcVideos([]);

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
    setTimeout(() => setAddedToCart(false), 1200);
  };

  const handleBuyNow = () => {
    if (hasSizes && !selectedSize) {
      setSizeRequired(true);
      return;
    }
    setSizeRequired(false);
    onBuyNow?.(product, selectedSize ?? undefined);
  };

  const displayBrand = product.vendor || product.brand;
  const storeUrl = product.merchantUrl || product.affiliateUrl;
  const fitNote = [
    product.creatorHeightCm != null ? `${product.creatorHeightCm} cm` : null,
    product.creatorTaggedSize ? `wears ${product.creatorTaggedSize}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

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
      <div className="absolute inset-0 bg-[#171411]/55 backdrop-blur-sm animate-in fade-in duration-200" />

      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-card border-t border-border rounded-t-[30px] p-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[88vh] overflow-y-auto md:max-w-2xl md:max-h-[90vh] md:rounded-[24px] md:border md:shadow-[0_35px_80px_-35px_rgba(23,20,17,0.6)]"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 md:hidden" />

        <div className="flex flex-col gap-5 md:flex-row">
          {imageList.length > 0 && (
            <div
              className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden flex-shrink-0 md:w-60 md:h-80 md:aspect-auto"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={imageList[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 240px, 100vw"
              />
              {imageList.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-medium uppercase tracking-[0.14em] px-2 py-1 rounded-md">
                  {currentImageIndex + 1}/{imageList.length}
                </div>
              )}
              {imageList.length > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1">
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
            <p className="retail-kicker mb-2">Product details</p>
            <h3 className="text-[2rem] leading-none font-display font-semibold tracking-[-0.03em] text-text">
              {product.name}
            </h3>
            {displayBrand && (
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted mt-3">{displayBrand}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              {product.price != null && (
                <p className="text-xl font-semibold text-text">
                  {formatPrice(product.price)}
                </p>
              )}
              {product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price && (
                <p className="text-xs uppercase tracking-[0.14em] text-muted line-through">
                  {formatPrice(product.compareAtPrice)}
                </p>
              )}
            </div>

            {stockStatus && (
              <div className="mt-1.5">
                {stockStatus === "in" && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-green-600">In Stock</span>
                )}
                {stockStatus === "low" && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">Low Stock</span>
                )}
                {stockStatus === "out" && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600">Out of Stock</span>
                )}
              </div>
            )}

            {fitNote && (
              <div className="mt-4 rounded-xl border border-border bg-surface/60 px-3 py-2">
                <p className="retail-kicker mb-1">Live fit guide</p>
                <p className="text-sm text-text">{fitNote}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 py-4 border-t border-b border-border">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-text font-semibold">
              Estimated delivery: 3-7 business days
            </p>
            <p className="text-[11px] text-muted mt-1">
              Shipping calculated at checkout &middot; Sold by {displayBrand || "merchant"}
            </p>
          </div>
        </div>

        {product.description && (
          <div className="mt-5">
            <p className="retail-kicker mb-2">Description</p>
            <p className="text-sm text-muted leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {hasSizes && (
          <div className="mt-5">
            <p className={`retail-kicker mb-3 ${sizeRequired ? "!text-red-600" : ""}`}>
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
                    className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-md border transition-colors ${
                      isUnavailable
                        ? "border-border bg-card text-muted/40 cursor-not-allowed line-through"
                        : selectedSize === size
                          ? "border-text bg-text text-accent-fg"
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
          {onBuyNow && (
            <button
              onClick={handleBuyNow}
              disabled={stockStatus === "out"}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 ${
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

          <button
            onClick={handleAddToCart}
            disabled={stockStatus === "out" || addedToCart}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 ${
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
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>

        {storeUrl && (
          <div className="mt-3 text-center">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted hover:text-text transition-colors"
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

        {(ugcVideos.length > 0 || loadingUgc) && (
          <div className="mt-6 border-t border-border pt-4">
            {loadingUgc && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                Loading related videos...
              </div>
            )}

            {!loadingUgc && ugcVideos.length > 0 && (
              <>
                <p className="retail-kicker mb-3">Seen in videos</p>
                <div className="grid grid-cols-3 gap-2">
                  {ugcVideos.slice(0, 6).map((ugc) => (
                    <Link
                      key={ugc.id}
                      href={`/@${ugc.user.username}/${ugc.id}`}
                      className="group block"
                    >
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface">
                        {ugc.thumbnailUrl ? (
                          <Image
                            src={ugc.thumbnailUrl}
                            alt={ugc.title || "UGC video"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="120px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted text-xs">
                            No preview
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
