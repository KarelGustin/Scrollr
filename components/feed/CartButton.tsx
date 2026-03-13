"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useCart } from "@/hooks/useCart";

export default function CartButton() {
  const { data: cart } = useCart();
  const { itemCount, setItemCount, toggleCart } = useCartStore();

  useEffect(() => {
    if (cart?.items) {
      setItemCount(cart.items.length);
    }
  }, [cart?.items, setItemCount]);

  return (
    <button
      onClick={toggleCart}
      className="fixed top-4 right-4 z-40 flex items-center justify-center w-11 h-11 bg-surface/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-transform active:scale-95"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-fg text-[10px] font-bold rounded-full flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
