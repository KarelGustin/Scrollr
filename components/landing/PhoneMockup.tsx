"use client";

import { useEffect, useState } from "react";

type Phase = "watching" | "dots" | "products" | "tap" | "added" | "scroll";

export function PhoneMockup() {
  const [phase, setPhase] = useState<Phase>("watching");
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    const timeline = [
      { phase: "watching" as Phase, duration: 1800 },
      { phase: "dots" as Phase, duration: 1200 },
      { phase: "products" as Phase, duration: 1600 },
      { phase: "tap" as Phase, duration: 800 },
      { phase: "added" as Phase, duration: 1400 },
      { phase: "scroll" as Phase, duration: 1000 },
    ];

    let timeout: ReturnType<typeof setTimeout>;
    let currentStep = 0;

    const advance = () => {
      const step = timeline[currentStep];
      setPhase(step.phase);

      if (step.phase === "scroll") {
        timeout = setTimeout(() => {
          setVideoIndex((i) => (i + 1) % 2);
          currentStep = 0;
          advance();
        }, step.duration);
      } else {
        timeout = setTimeout(() => {
          currentStep++;
          advance();
        }, step.duration);
      }
    };

    advance();
    return () => clearTimeout(timeout);
  }, []);

  const videos = [
    { gradient: "from-rose-300 via-pink-200 to-orange-200", creator: "@emma" },
    { gradient: "from-sky-300 via-indigo-200 to-violet-200", creator: "@mia" },
  ];

  const video = videos[videoIndex];
  const showDots = phase !== "watching";
  const showProducts = phase === "products" || phase === "tap" || phase === "added";
  const showAdded = phase === "added";
  const isScrolling = phase === "scroll";

  return (
    <div className="phone-frame">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 h-12 z-20 flex items-end justify-between px-6 pb-1">
        <span className="text-[10px] font-medium text-white/70">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-3.5 h-2.5 border border-white/70 rounded-[2px] flex items-center justify-end p-[1px]">
            <div className="w-1.5 h-full bg-white/70 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Video content */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${video.gradient} transition-all duration-500 ${
          isScrolling ? "translate-y-[-100%]" : "translate-y-0"
        }`}
      >
        {/* Silhouette figure */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="100" height="200" viewBox="0 0 100 200" className="opacity-20">
            <circle cx="50" cy="30" r="18" fill="currentColor" />
            <path d="M50 48 L50 120 M50 70 L25 100 M50 70 L75 100 M50 120 L30 170 M50 120 L70 170" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* Product dots — coral themed */}
        {showDots && (
          <>
            <div className="absolute top-[35%] left-[45%] w-3 h-3 bg-[#FF6B4A] rounded-full shadow-lg animate-dot-appear ring-2 ring-white/50" />
            <div className="absolute top-[50%] left-[52%] w-3 h-3 bg-[#FF6B4A] rounded-full shadow-lg animate-dot-appear ring-2 ring-white/50" style={{ animationDelay: "0.15s" }} />
            <div className="absolute top-[65%] left-[40%] w-3 h-3 bg-[#FF6B4A] rounded-full shadow-lg animate-dot-appear ring-2 ring-white/50" style={{ animationDelay: "0.3s" }} />
          </>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />

      {/* Creator badge */}
      <div className="absolute top-14 left-4 z-20 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur" />
        <span className="text-white text-xs font-medium">{video.creator}</span>
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4">
        <button className="flex flex-col items-center gap-0.5">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
          <span className="text-white text-[9px]">2.4k</span>
        </button>
        <button className="flex flex-col items-center gap-0.5">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          <span className="text-white text-[9px]">Share</span>
        </button>
      </div>

      {/* Product row — slides up */}
      {showProducts && (
        <div className="absolute bottom-4 left-3 right-3 z-20 animate-slide-in-products">
          <div className="flex gap-2 overflow-hidden">
            {["Top", "Skirt", "Bag"].map((item, i) => (
              <div
                key={item}
                className={`flex-shrink-0 w-[72px] rounded-xl overflow-hidden transition-all duration-200 ${
                  phase === "tap" && i === 0 ? "ring-2 ring-[#FF6B4A] scale-[1.02]" : ""
                }`}
              >
                <div className="h-16 bg-white/15 backdrop-blur-sm" />
                <div className="bg-black/50 backdrop-blur px-2 py-1.5">
                  <p className="text-[9px] text-white font-medium truncate">{item}</p>
                  <p className="text-[8px] text-[#FF6B4A]">${(i + 1) * 29}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Added to cart toast */}
      {showAdded && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-add-to-cart-pop">
          <div className="bg-[#FF6B4A] text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Added to cart
          </div>
        </div>
      )}
    </div>
  );
}
