"use client";

import { useEffect, useState } from "react";

interface ProductStats {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number;
  available: boolean;
  videoCount: number;
  views: number;
  cartAdds: number;
  purchases: number;
  revenue: number;
}

export default function MerchantProductsPage() {
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"revenue" | "tagged" | "views">("revenue");

  useEffect(() => {
    fetch("/api/merchant/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "revenue") return b.revenue - a.revenue;
      if (sort === "tagged") return b.videoCount - a.videoCount;
      return b.views - a.views;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-text">Products</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50 w-48"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none"
          >
            <option value="revenue">Top Revenue</option>
            <option value="tagged">Most Tagged</option>
            <option value="views">Most Views</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted text-sm">No products yet</p>
          <p className="text-muted text-xs mt-1">Products will appear here once synced from your store</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs text-muted font-medium">Product</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-right">Tagged</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-right">Views</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-right">Cart Adds</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-right">Purchases</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-xs text-muted">N/A</div>
                        )}
                        <div>
                          <p className="font-medium text-text">{p.title}</p>
                          <p className="text-xs text-muted">${p.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{p.videoCount}</td>
                    <td className="px-4 py-3 text-right text-muted">{p.views}</td>
                    <td className="px-4 py-3 text-right text-muted">{p.cartAdds}</td>
                    <td className="px-4 py-3 text-right text-muted">{p.purchases}</td>
                    <td className="px-4 py-3 text-right font-semibold text-success">${p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
