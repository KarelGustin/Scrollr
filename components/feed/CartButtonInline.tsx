"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useCart } from "@/hooks/useCart";

export default function CartButtonInline() {
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
      className="relative p-2 text-white/80 hover:text-white transition-colors"
    >
      <svg className="w-5 h-5 drop-shadow-lg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-fg text-[9px] font-bold rounded-full flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
