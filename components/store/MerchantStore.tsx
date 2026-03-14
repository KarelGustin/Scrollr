"use client";

import { useState } from "react";
import Image from "next/image";
import StoreProductModal from "./StoreProductModal";

interface MerchantStoreProps {
  merchant: {
    id: string;
    storeName: string | null;
    storeLogoUrl: string | null;
    shippingPolicy: string | null;
    returnPolicy: string | null;
  };
  products: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    images: unknown;
    price: number;
    compareAtPrice: number | null;
    currency: string;
    productType: string | null;
    vendor: string | null;
    inventoryQuantity: number | null;
    available: boolean;
    tags: string | null;
  }>;
  categories: string[];
}

export default function MerchantStore({ merchant, products, categories }: MerchantStoreProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MerchantStoreProps["products"][number] | null>(null);

  const filteredProducts = activeCategory
    ? products.filter((p) => p.productType === activeCategory)
    : products;

  const storeName = merchant.storeName || "Store";
  const initial = storeName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {merchant.storeLogoUrl ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                <Image
                  src={merchant.storeLogoUrl}
                  alt={storeName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-display font-bold text-accent-fg">
                  {initial}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-display font-bold text-text truncate">
                {storeName}
              </h1>
              <p className="text-sm text-muted mt-0.5">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === null
                    ? "bg-accent text-accent-fg"
                    : "bg-surface text-muted hover:text-text"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-accent text-accent-fg"
                      : "bg-surface text-muted hover:text-text"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h2 className="text-xl font-display font-bold text-text mb-2">
                No products found
              </h2>
              <p className="text-muted text-sm">
                {activeCategory
                  ? "Try selecting a different category."
                  : "This store doesn\u2019t have any products yet."}
              </p>
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="mt-4 px-5 py-2 bg-accent text-accent-fg rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  View all
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="text-left group bg-card rounded-xl overflow-hidden border border-border hover:border-accent/40 transition-colors"
              >
                {/* Product image */}
                <div className="relative aspect-square bg-surface overflow-hidden rounded-t-xl">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-text line-clamp-2 leading-snug">
                    {product.title}
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-accent">
                      {product.currency === "USD" ? "$" : product.currency}{product.price.toFixed(2)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-xs text-muted line-through">
                        {product.currency === "USD" ? "$" : product.currency}{product.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.vendor && (
                    <p className="mt-1 text-xs text-muted truncate">{product.vendor}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product detail modal */}
      <StoreProductModal
        product={selectedProduct ? {
          ...selectedProduct,
          images: Array.isArray(selectedProduct.images) ? selectedProduct.images as string[] : null,
        } : null}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
