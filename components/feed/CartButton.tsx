"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useCart } from "@/hooks/useCart";

export default function CartButton() {
  const { data: cart } = useCart();
  const { itemCount, setItemCount, toggleCart } = useCartStore();
  const prevCountRef = useRef(itemCount);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (cart?.items) {
      setItemCount(cart.items.length);
    }
  }, [cart?.items, setItemCount]);

  // Badge bounce on increase
  useEffect(() => {
    if (itemCount > prevCountRef.current && badgeRef.current) {
      badgeRef.current.style.animation = "none";
      badgeRef.current.offsetHeight; // trigger reflow
      badgeRef.current.style.animation = "badge-bounce 0.4s ease-out";
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  return (
    <button
      onClick={toggleCart}
      className="fixed top-4 right-4 z-40 flex items-center justify-center w-11 h-11 transition-transform active:scale-95"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 drop-shadow-lg">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
      {itemCount > 0 && (
        <span
          ref={badgeRef}
          className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-fg text-[10px] font-bold rounded-full flex items-center justify-center"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
