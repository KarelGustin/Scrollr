"use client";

import { useMemo } from "react";
import { useCart, useRemoveCartItem, useUpdateCartItem, useClearCart } from "@/hooks/useCart";
import { useCartStore } from "@/stores/cartStore";

export default function CartDrawer() {
  const { data: cart, isLoading } = useCart();
  const removeItem = useRemoveCartItem();
  const updateItem = useUpdateCartItem();
  const clearCart = useClearCart();
  const closeCart = useCartStore((s) => s.closeCart);

  // Group items by creator
  const grouped = useMemo(() => {
    if (!cart?.items) return [];
    const groups = new Map<string, { creator: { id: string; username: string | null; name: string | null }; items: typeof cart.items }>();

    for (const item of cart.items) {
      const creatorId = item.product.user.id;
      if (!groups.has(creatorId)) {
        groups.set(creatorId, {
          creator: item.product.user,
          items: [],
        });
      }
      groups.get(creatorId)!.items.push(item);
    }

    return Array.from(groups.values());
  }, [cart?.items]);

  const handleCheckout = (creatorItems: typeof cart.items) => {
    // Open all affiliate URLs for this creator's products
    for (const item of creatorItems) {
      window.open(`/r/${item.product.id}`, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={closeCart}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Drawer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-surface border-l border-border animate-in slide-in-from-right duration-300 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-display font-bold text-text">Cart</h2>
          <div className="flex items-center gap-3">
            {cart?.items?.length > 0 && (
              <button
                onClick={() => clearCart.mutate()}
                className="text-xs text-muted hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            )}
            <button onClick={closeCart} className="text-muted hover:text-text transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className="text-sm text-muted text-center py-8">Loading...</p>
          ) : grouped.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto mb-3 text-muted" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              <p className="text-sm text-muted">Your cart is empty</p>
              <p className="text-xs text-muted mt-1">
                Browse videos and add products you love
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ creator, items }) => (
                <div key={creator.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      {creator.name ?? `@${creator.username}`}
                    </p>
                    <button
                      onClick={() => handleCheckout(items)}
                      className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      Shop All &rarr;
                    </button>
                  </div>

                  {items.map((item: { id: string; quantity: number; product: { id: string; name: string; brand: string | null; priceDisplay: string | null; imageUrl: string | null } }) => (
                    <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl p-3">
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {item.product.name}
                        </p>
                        {item.product.priceDisplay && (
                          <p className="text-xs text-accent">
                            {item.product.priceDisplay}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem.mutate(item.id);
                              } else {
                                updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 });
                              }
                            }}
                            className="px-2 py-1 text-muted hover:text-text text-sm"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-sm text-text min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                            className="px-2 py-1 text-muted hover:text-text text-sm"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem.mutate(item.id)}
                          className="text-muted hover:text-destructive transition-colors p-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
