"use client";

import { useEffect, useState } from "react";

const PRODUCTS = [
  { name: "Cloud Sneakers", brand: "Nike", price: "$189", color: "from-violet-600 to-blue-500" },
  { name: "Glow Serum", brand: "Glossier", price: "$34", color: "from-pink-500 to-orange-400" },
  { name: "Minimal Watch", brand: "Nordgreen", price: "$229", color: "from-emerald-500 to-teal-400" },
];

export function PhoneMockup() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % PRODUCTS.length);
        setIsTransitioning(false);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const product = PRODUCTS[activeIndex];

  return (
    <div className="phone-frame animate-float">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 h-12 z-20 flex items-end justify-between px-6 pb-1">
        <span className="text-[10px] font-medium text-white/70">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-3.5 h-2.5 border border-white/70 rounded-[2px] flex items-center justify-end p-[1px]">
            <div className="w-1.5 h-full bg-white/70 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Video content simulation */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${product.color} transition-opacity duration-400 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Subtle animated pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/10 animate-morph" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-black/10 animate-morph" style={{ animationDelay: "2s" }} />
        </div>

        {/* Product visual placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

      {/* Product tag */}
      <div
        className={`absolute bottom-6 left-4 right-4 z-20 transition-all duration-400 ${
          isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="mb-3">
          <p className="text-white text-base font-semibold leading-tight">{product.name}</p>
          <p className="text-white/60 text-xs mt-0.5">{product.brand}</p>
          <p className="text-accent text-sm font-bold mt-1">{product.price}</p>
        </div>
        <div className="w-full py-2.5 bg-accent rounded-xl flex items-center justify-center">
          <span className="text-accent-fg text-sm font-semibold tracking-tight">Shop Now</span>
          <svg className="w-3.5 h-3.5 text-accent-fg ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </div>
      </div>

      {/* Swipe indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
        {PRODUCTS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-4 bg-white" : "w-1 bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col gap-4 items-center">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span className="text-[9px] text-white/70">2.4k</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </div>
          <span className="text-[9px] text-white/70">Share</span>
        </div>
      </div>

      {/* Top profile */}
      <div className="absolute top-14 left-4 z-20 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-emerald-400" />
        <span className="text-white text-xs font-medium">@luna</span>
      </div>
    </div>
  );
}
