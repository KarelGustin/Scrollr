interface ProductCardProps {
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    price: number;
    compareAtPrice: number | null;
  };
  isDark: boolean;
  onClick: () => void;
}

export function ProductCard({ product, isDark, onClick }: ProductCardProps) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  return (
    <button onClick={onClick} className="text-left w-full group">
      <div className={`aspect-[3/4] rounded-lg overflow-hidden ${isDark ? "bg-white/5" : "bg-[#f0eeeb]"}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🛍️</div>
        )}
      </div>
      <div className="mt-2">
        <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>{product.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-sm ${isDark ? "text-white/70" : "text-[#888]"}`}>€{product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-xs text-[#bbb] line-through">€{product.compareAtPrice!.toFixed(2)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
