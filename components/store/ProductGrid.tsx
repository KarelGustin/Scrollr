"use client";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  title: string;
  products: any[];
  isDark: boolean;
  onProductClick: (productId: string) => void;
}

export function ProductGrid({ title, products, isDark, onProductClick }: ProductGridProps) {
  if (products.length === 0) return null;
  return (
    <div className="px-6 mb-8">
      <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-white/40" : "text-[#1a1a1a]"}`}>{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} isDark={isDark} onClick={() => onProductClick(product.id)} />
        ))}
      </div>
    </div>
  );
}
