"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAddToCart } from "@/hooks/useCart";

export interface ProductModalProduct {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  images?: string[] | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  vendor: string | null;
  inventoryQuantity: number | null;
  available: boolean;
}

interface Variant {
  id: string;
  title: string;
  price: number;
  sku: string | null;
  inventoryQuantity: number | null;
  available: boolean;
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

interface ProductModalProps {
  product: ProductModalProduct | null;
  onClose: () => void;
  open: boolean;
}

export default function ProductModal({ product, onClose, open }: ProductModalProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [ugcVideos, setUgcVideos] = useState<UgcVideo[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingUgc, setLoadingUgc] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);

  const addToCart = useAddToCart();

  // Image list: prefer `images` array, fall back to single `imageUrl`
  const imageList = product?.images && product.images.length > 0
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : [];

  // Reset state when product changes
  useEffect(() => {
    if (!product || !open) {
      setVariants([]);
      setSelectedSize(null);
      setUgcVideos([]);
      setDescExpanded(false);
      setAddedToCart(false);
      setCurrentImageIndex(0);
      return;
    }

    // Fetch variants
    setLoadingVariants(true);
    fetch(`/api/merchant-products/${product.id}/variants`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVariants(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVariants(false));

    // Fetch UGC videos
    setLoadingUgc(true);
    fetch(`/api/merchant-products/${product.id}/ugc`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUgcVideos(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUgc(false));
  }, [product, open]);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!product || !open) return null;

  const hasVariants = variants.length > 0;
  const sizes = hasVariants
    ? variants.map((v) => ({
        label: v.title,
        variantId: v.id,
        available: v.available,
      }))
    : [];

  // Stock indicator
  const qty = product.inventoryQuantity;
  const stockStatus = !product.available
    ? "out"
    : qty !== null && qty <= 0
    ? "out"
    : qty !== null && qty < 5
    ? "low"
    : "in";

  const canAddToCart =
    product.available && stockStatus !== "out" && (!hasVariants || selectedSize !== null);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart.mutate(
      {
        merchantProductId: product.id,
        selectedSize: selectedSize ?? undefined,
      },
      {
        onSuccess: () => {
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 2000);
        },
      }
    );
  };

  const description = product.description ?? "";
  const isLongDesc = description.length > 200;

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto bg-card rounded-t-2xl animate-slide-up md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-2xl md:max-h-[85vh]">
        {/* Handle bar (mobile) */}
        <div className="sticky top-0 z-10 flex justify-center py-3 bg-card rounded-t-2xl md:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Close button (desktop) */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-3 right-3 z-20 w-8 h-8 items-center justify-center rounded-full bg-surface/80 text-muted hover:text-text transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="px-4 pb-8">
          {/* Image carousel */}
          {imageList.length > 0 && (
            <div className="relative">
              <div
                className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-surface mb-4"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <Image
                  src={imageList[currentImageIndex]}
                  alt={product.title}
                  fill
                  className="object-cover transition-opacity duration-200"
                  sizes="(max-width: 640px) 100vw, 384px"
                />
              </div>

              {/* Dot indicators */}
              {imageList.length > 1 && (
                <div className="flex justify-center gap-1.5 mb-3">
                  {imageList.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentImageIndex ? "bg-accent" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl font-display font-bold text-text">{product.title}</h2>

          {/* Vendor badge */}
          {product.vendor && (
            <p className="mt-1 text-sm text-muted">{product.vendor}</p>
          )}

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-accent">
              {product.currency === "USD" ? "$" : product.currency}
              {product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-muted line-through">
                {product.currency === "USD" ? "$" : product.currency}
                {product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="mt-4">
              <p className={`text-sm text-text/80 leading-relaxed ${!descExpanded && isLongDesc ? "line-clamp-3" : ""}`}>
                {description}
              </p>
              {isLongDesc && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-1 text-xs font-medium text-accent hover:underline"
                >
                  {descExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Variant/size selector */}
          {hasVariants && (
            <div className="mt-5">
              <p className="text-sm font-medium text-text mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.variantId}
                    disabled={!size.available}
                    onClick={() => setSelectedSize(size.label)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      selectedSize === size.label
                        ? "border-accent bg-accent/10 text-accent"
                        : size.available
                        ? "border-border text-text hover:border-accent/40"
                        : "border-border text-muted opacity-40 cursor-not-allowed line-through"
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingVariants && (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted">
              <div className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
              Loading options...
            </div>
          )}

          {/* Stock indicator */}
          <div className="mt-4">
            {stockStatus === "in" && (
              <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
                <span className="w-2 h-2 rounded-full bg-success" />
                In Stock
              </span>
            )}
            {stockStatus === "low" && (
              <span className="inline-flex items-center gap-1.5 text-sm text-warning font-medium">
                <span className="w-2 h-2 rounded-full bg-warning" />
                Low Stock — only {qty} left
              </span>
            )}
            {stockStatus === "out" && (
              <span className="inline-flex items-center gap-1.5 text-sm text-destructive font-medium">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <button
            disabled={!canAddToCart || addToCart.isPending}
            onClick={handleAddToCart}
            className={`mt-5 w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
              addedToCart
                ? "bg-success text-white"
                : canAddToCart
                ? "bg-accent text-accent-fg hover:opacity-90 active:scale-[0.98]"
                : "bg-surface text-muted cursor-not-allowed"
            }`}
          >
            {addToCart.isPending
              ? "Adding..."
              : addedToCart
              ? "Added to Cart!"
              : hasVariants && !selectedSize
              ? "Select a Size"
              : stockStatus === "out"
              ? "Out of Stock"
              : "Add to Cart"}
          </button>

          {/* UGC Section */}
          {(ugcVideos.length > 0 || loadingUgc) && (
            <div className="my-6 border-t border-border" />
          )}

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
                      {/* Username overlay */}
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
      </div>
    </>
  );
}
