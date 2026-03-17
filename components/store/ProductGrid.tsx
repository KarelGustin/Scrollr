"use client";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  title: string;
  products: any[];
  isDark: boolean;
  onProductClick: (productId: string) => void;
  columns?: 2 | 3 | 4;
  showAll?: boolean;
}

export function ProductGrid({ title, products, isDark, onProductClick, columns = 2, showAll = true }: ProductGridProps) {
  if (products.length === 0) return null;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  }[columns];

  return (
    <div className="px-4 sm:px-6 mb-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className={`text-sm font-semibold uppercase tracking-[0.15em] ${isDark ? "text-white/50" : "text-[#1a1a1a]"}`}>
          {title}
        </h2>
        {!showAll && products.length > 8 && (
          <button className={`text-[11px] font-medium tracking-wider uppercase ${isDark ? "text-white/40 hover:text-white/60" : "text-[#999] hover:text-[#666]"} transition-colors`}>
            View All
          </button>
        )}
      </div>
      <div className={`grid ${gridCols} gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isDark={isDark}
            onClick={() => onProductClick(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
