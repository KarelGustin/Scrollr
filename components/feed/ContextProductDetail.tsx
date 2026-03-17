"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeedVideoProduct } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { useAddToCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";

interface ContextProductDetailProps {
  product: FeedVideoProduct;
  onBuyNow?: (product: FeedVideoProduct, selectedSize?: string) => void;
}

export default function ContextProductDetail({ product, onBuyNow }: ContextProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const addToCart = useAddToCart();
  const { status } = useAuth();

  const availableSizes = product.variants
    ? product.variants.filter((v) => v.available).map((v) => v.title)
    : product.sizes ?? [];

  const hasSizes = availableSizes && availableSizes.length > 0;
  const displayBrand = product.vendor || product.brand;
  const imageUrl = product.images?.[0] ?? product.imageUrl;

  const handleAddToCart = () => {
    if (status !== "authenticated") return;
    if (hasSizes && !selectedSize) return;
    if (product.merchantProductId) {
      addToCart.mutate(
        { merchantProductId: product.merchantProductId, selectedSize: selectedSize ?? undefined },
        {
          onSuccess: () => {
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 1200);
          },
        }
      );
    } else {
      addToCart.mutate(
        { productId: product.id },
        {
          onSuccess: () => {
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 1200);
          },
        }
      );
    }
  };

  const handleBuyNow = () => {
    if (status !== "authenticated") return;
    if (hasSizes && !selectedSize) return;
    onBuyNow?.(product, selectedSize ?? undefined);
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Full-width product image */}
      {imageUrl ? (
        <div className="relative w-full aspect-[4/3] bg-surface">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 400px, 100vw"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-surface flex items-center justify-center">
          <svg className="w-12 h-12 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}

      {/* Product info */}
      <div className="p-4">
        <h3 className="text-base font-bold text-text">{product.name}</h3>
        {displayBrand && (
          <p className="text-sm text-muted mt-0.5">{displayBrand}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {product.price != null && (
            <span className="text-lg font-bold text-text">
              {formatPrice(product.price)}
            </span>
          )}
          {product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Size picker */}
        {hasSizes && (
          <div className="mt-3">
            <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1.5">Select size</p>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    selectedSize === size
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text hover:border-text/30"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleAddToCart}
            disabled={addToCart.isPending || addedToCart || (hasSizes && !selectedSize)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
              addedToCart
                ? "border-green-500/30 bg-green-500/10 text-green-500"
                : "border-border text-text hover:bg-surface disabled:opacity-50"
            }`}
          >
            {addToCart.isPending ? (
              <ButtonSpinner />
            ) : addedToCart ? (
              "Added"
            ) : (
              "Add to Cart"
            )}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={hasSizes && !selectedSize}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-accent text-accent-fg hover:bg-accent/90 transition-all disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
