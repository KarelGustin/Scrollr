"use client";

import { useState } from "react";
import type { FeedVideo, FeedVideoProduct } from "@/types";
import { useFeedStore } from "@/stores/feedStore";
import ContextCreatorInfo from "./ContextCreatorInfo";
import ContextProductDetail from "./ContextProductDetail";
import ContextRelatedProducts from "./ContextRelatedProducts";
import CheckoutSheet from "./CheckoutSheet";

interface ContextPanelProps {
  videos: FeedVideo[];
}

export default function ContextPanel({ videos }: ContextPanelProps) {
  const currentIndex = useFeedStore((s) => s.currentIndex);
  const currentVideo = videos[currentIndex];
  const [buyNowProduct, setBuyNowProduct] = useState<{
    product: FeedVideoProduct;
    selectedSize?: string;
  } | null>(null);

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        No video selected
      </div>
    );
  }

  const hasProducts = currentVideo.products.length > 0;
  const firstProduct = hasProducts ? currentVideo.products[0] : null;

  const handleBuyNow = (product: FeedVideoProduct, selectedSize?: string) => {
    setBuyNowProduct({ product, selectedSize });
  };

  return (
    <div className="max-w-lg px-5 py-5">
      {/* Creator / Store info */}
      <ContextCreatorInfo user={currentVideo.user} />

      {/* Product list */}
      {hasProducts && (
        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">
            Shop this video
          </p>
          <div className="space-y-3">
            {currentVideo.products.map((product) => (
              <ContextProductDetail
                key={product.id}
                product={product}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>
        </div>
      )}

      {/* Related */}
      {firstProduct?.merchantProductId && (
        <div className="mt-5">
          <ContextRelatedProducts
            merchantProductId={firstProduct.merchantProductId}
          />
        </div>
      )}

      {/* Checkout Sheet */}
      {buyNowProduct && (
        <CheckoutSheet
          product={buyNowProduct.product}
          selectedSize={buyNowProduct.selectedSize}
          onClose={() => setBuyNowProduct(null)}
          onSuccess={() => setBuyNowProduct(null)}
        />
      )}
    </div>
  );
}
