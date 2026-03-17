"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart, useRemoveCartItem, useUpdateCartItem, useClearCart } from "@/hooks/useCart";
import { useCartStore } from "@/stores/cartStore";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import type { CartItemWithProduct } from "@/types";

export default function CartDrawer() {
  const { data: cart, isLoading } = useCart();
  const removeItem = useRemoveCartItem();
  const updateItem = useUpdateCartItem();
  const clearCart = useClearCart();
  const closeCart = useCartStore((s) => s.closeCart);
  const router = useRouter();

  // Group items by merchant (for merchant products) or creator (for legacy products)
  const grouped = useMemo(() => {
    if (!cart?.items) return [];
    const groups = new Map<
      string,
      {
        groupId: string;
        label: string;
        type: "merchant" | "creator";
        items: CartItemWithProduct[];
      }
    >();

    for (const item of cart.items as CartItemWithProduct[]) {
      if (item.merchantProduct) {
        const merchantId = item.merchantProduct.merchant.id;
        if (!groups.has(`m-${merchantId}`)) {
          groups.set(`m-${merchantId}`, {
            groupId: merchantId,
            label: item.merchantProduct.merchant.storeName ?? "Store",
            type: "merchant",
            items: [],
          });
        }
        groups.get(`m-${merchantId}`)!.items.push(item);
      } else if (item.product) {
        const creatorId = item.product.user.id;
        if (!groups.has(`c-${creatorId}`)) {
          groups.set(`c-${creatorId}`, {
            groupId: creatorId,
            label: item.product.user.name ?? `@${item.product.user.username}`,
            type: "creator",
            items: [],
          });
        }
        groups.get(`c-${creatorId}`)!.items.push(item);
      }
    }

    return Array.from(groups.values());
  }, [cart?.items]);

  const handleShopAll = (group: (typeof grouped)[number]) => {
    for (const item of group.items) {
      if (item.merchantProduct?.productUrl) {
        window.open(item.merchantProduct.productUrl, "_blank");
      } else if (item.product) {
        window.open(`/r/${item.product.id}`, "_blank");
      }
    }
  };

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  // Get display values for an item (merchant product takes precedence)
  const getItemDisplay = (item: CartItemWithProduct) => {
    if (item.merchantProduct) {
      return {
        name: item.merchantProduct.title,
        price: `$${item.merchantProduct.price.toFixed(2)}`,
        imageUrl: item.merchantProduct.imageUrl,
      };
    }
    if (item.product) {
      return {
        name: item.product.name,
        price: item.product.priceDisplay,
        imageUrl: item.product.imageUrl,
      };
    }
    return { name: "Unknown item", price: null, imageUrl: null };
  };

  const totalItems = cart?.items?.length ?? 0;

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
            {totalItems > 0 && (
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
              {grouped.map((group) => (
                <div key={`${group.type}-${group.groupId}`} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      {group.label}
                    </p>
                    <button
                      onClick={() => handleShopAll(group)}
                      className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      Shop All &rarr;
                    </button>
                  </div>

                  {group.items.map((item) => {
                    const display = getItemDisplay(item);
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl p-3">
                        {display.imageUrl && (
                          <img
                            src={display.imageUrl}
                            alt={display.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">
                            {display.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {display.price && (
                              <p className="text-xs text-accent">
                                {display.price}
                              </p>
                            )}
                            {item.selectedSize && (
                              <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-md font-medium">
                                {item.selectedSize}
                              </span>
                            )}
                          </div>
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
                              disabled={removeItem.isPending || updateItem.isPending}
                              className="px-2 py-1 text-muted hover:text-text text-sm disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="px-2 py-1 text-sm text-text min-w-[24px] text-center">
                              {updateItem.isPending ? <ButtonSpinner className="h-3 w-3 mx-auto" /> : item.quantity}
                            </span>
                            <button
                              onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                              disabled={updateItem.isPending}
                              className="px-2 py-1 text-muted hover:text-text text-sm disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem.mutate(item.id)}
                            disabled={removeItem.isPending}
                            className="text-muted hover:text-destructive transition-colors p-1 disabled:opacity-50"
                          >
                            {removeItem.isPending ? (
                              <ButtonSpinner className="h-3.5 w-3.5" />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout button */}
        {totalItems > 0 && (
          <div className="px-5 py-4 border-t border-border">
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              Checkout
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
