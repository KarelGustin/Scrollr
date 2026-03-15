"use client";
import { useState } from "react";
import { CategoryChips } from "@/components/store/CategoryChips";
import { ProductGrid } from "@/components/store/ProductGrid";
import { StoreProductModal } from "@/components/store/StoreProductModal";

interface StorePageClientProps {
  products: any[];
  categories: string[];
  isDark: boolean;
  merchantId: string;
}

export function StorePageClient({ products, categories, isDark, merchantId }: StorePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const filtered = selectedCategory === "All"
    ? products
    : products.filter((p) => p.productType === selectedCategory);

  const newProducts = [...filtered]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const bestSelling = filtered.slice(0, 8); // placeholder — sort by sales later

  return (
    <>
      <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} isDark={isDark} />
      <ProductGrid title="New" products={newProducts} isDark={isDark} onProductClick={setSelectedProductId} />
      <ProductGrid title="Best Selling" products={bestSelling} isDark={isDark} onProductClick={setSelectedProductId} />
      <ProductGrid title="All Products" products={filtered} isDark={isDark} onProductClick={setSelectedProductId} />
      {selectedProductId && (
        <StoreProductModal productId={selectedProductId} merchantId={merchantId} isDark={isDark} onClose={() => setSelectedProductId(null)} />
      )}
    </>
  );
}
