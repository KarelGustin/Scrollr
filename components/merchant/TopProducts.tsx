"use client";

import { useEffect, useState } from "react";

interface TopProduct {
  title: string;
  salesCount: number;
  imageUrl: string | null;
}

export function TopProducts({ merchantId }: { merchantId: string }) {
  const [products, setProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    // For now, show placeholder — will be populated when orders flow in
  }, [merchantId]);

  return (
    <div className="bg-white border border-[#f0f0f0] rounded-xl p-5">
      <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">Top Products</h3>
      {products.length === 0 ? (
        <p className="text-sm text-[#999] py-6 text-center">Product performance data will appear here</p>
      ) : (
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#f5f5f5] last:border-0">
              <div className="w-10 h-10 rounded-lg bg-[#f5f3f0] overflow-hidden shrink-0">
                {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1a1a1a] truncate">{product.title}</p>
                <p className="text-xs text-[#999]">{product.salesCount} sales</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
