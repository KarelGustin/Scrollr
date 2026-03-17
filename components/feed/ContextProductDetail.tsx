"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeedVideoProduct } from "@/types";
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

  const availableSizes = product.variants
    ? product.variants.filter((v) => v.available).map((v) => v.title)
    : product.sizes ?? [];

  const hasSizes = availableSizes && availableSizes.length > 0;
  const displayBrand = product.vendor || product.brand;
  const imageUrl = product.images?.[0] ?? product.imageUrl;
  const fitNote = [
    product.creatorHeightCm != null ? `${product.creatorHeightCm} cm` : null,
    product.creatorTaggedSize ? `wears ${product.creatorTaggedSize}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const hasDiscount = product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price;

  const handleAddToCart = () => {
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
    if (hasSizes && !selectedSize) return;
    onBuyNow?.(product, selectedSize ?? undefined);
  };

  return (
    <div className="retail-panel rounded-xl overflow-hidden p-3 sm:p-4">
      <div className="flex gap-4">
        {/* Product image */}
        {imageUrl ? (
          <div className="relative w-24 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="w-24 h-28 rounded-lg flex-shrink-0 bg-surface flex items-center justify-center">
            <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}

        {/* Product info column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="retail-kicker mb-2">Selected Product</p>
            <h3 className="text-xl font-display font-semibold tracking-[-0.02em] text-text leading-tight line-clamp-2">{product.name}</h3>
            {displayBrand && (
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted mt-2 truncate">{displayBrand}</p>
            )}
            {fitNote && (
              <p className="text-xs text-muted mt-2">Fit guide: {fitNote}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {product.price != null && (
              <span className="text-lg font-semibold text-text">
                {formatPrice(product.price)}
              </span>
            )}
            {hasDiscount && (
              <span className="text-xs uppercase tracking-[0.14em] text-muted line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Size picker */}
      {hasSizes && (
        <div className="mt-4">
          <p className="retail-kicker mb-2">Select size</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-md border transition-colors ${
                  selectedSize === size
                    ? "border-text bg-text text-accent-fg"
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
          className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] rounded-md border transition-all flex items-center justify-center gap-1.5 ${
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
          className="flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] rounded-md bg-accent text-accent-fg hover:bg-accent/90 transition-all disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
