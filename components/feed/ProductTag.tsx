"use client";

import type { FeedProduct } from "@/types";

interface ProductTagProps {
  product: FeedProduct;
}

export default function ProductTag({ product }: ProductTagProps) {
  const handleShopClick = () => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ type: "SHOP_CLICK", productId: product.id }]),
    }).catch(() => {});

    window.open(`/r/${product.id}`, "_blank");
  };

  return (
    <div className="absolute bottom-0 left-0 z-20 p-4 pb-6 animate-slide-up">
      <p className="text-lg font-bold text-text">{product.name}</p>
      {product.brand && (
        <p className="text-sm text-muted">{product.brand}</p>
      )}
      {product.price && (
        <p className="text-accent font-semibold mt-0.5">{product.price}</p>
      )}
      <button
        onClick={handleShopClick}
        className="mt-2 px-4 py-2 bg-accent text-accent-fg font-semibold text-sm rounded-full hover:opacity-90 transition-opacity"
      >
        Shop Now &rarr;
      </button>
    </div>
  );
}
