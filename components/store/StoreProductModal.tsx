"use client";

import ProductModal from "@/components/product/ProductModal";
import type { ProductModalProduct } from "@/components/product/ProductModal";

interface StoreProductModalProps {
  product: ProductModalProduct | null;
  onClose: () => void;
}

export default function StoreProductModal({ product, onClose }: StoreProductModalProps) {
  return (
    <ProductModal
      product={product}
      onClose={onClose}
      open={product !== null}
    />
  );
}
