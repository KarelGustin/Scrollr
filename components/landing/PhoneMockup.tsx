"use client";

import { useEffect, useState } from "react";

// Animation phases: silhouette → dots appear → products slide up → tap product → added to cart → scroll to next
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

      {/* Video content — silhouette figure */}
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

        {/* Product dots on the outfit */}
        {showDots && (
          <>
            <div className="absolute top-[35%] left-[45%] w-3 h-3 bg-white rounded-full shadow-lg animate-dot-appear" />
            <div className="absolute top-[50%] left-[52%] w-3 h-3 bg-white rounded-full shadow-lg animate-dot-appear" style={{ animationDelay: "0.15s" }} />
            <div className="absolute top-[65%] left-[40%] w-3 h-3 bg-white rounded-full shadow-lg animate-dot-appear" style={{ animationDelay: "0.3s" }} />
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

      {/* Product row — slides up from bottom */}
      {showProducts && (
        <div className="absolute bottom-4 left-3 right-3 z-20 animate-slide-in-products">
          <div className="flex gap-2 overflow-hidden">
            {["Top", "Skirt", "Bag"].map((item, i) => (
              <div
                key={item}
                className={`flex-shrink-0 w-[72px] rounded-xl overflow-hidden transition-all duration-200 ${
                  phase === "tap" && i === 0 ? "ring-2 ring-white scale-[1.02]" : ""
                }`}
              >
                <div className="h-16 bg-white/15 backdrop-blur-sm" />
                <div className="bg-black/50 backdrop-blur px-2 py-1.5">
                  <p className="text-[9px] text-white font-medium truncate">{item}</p>
                  <p className="text-[8px] text-white/60">${(i + 1) * 29}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Added to cart toast */}
      {showAdded && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-add-to-cart-pop">
          <div className="bg-white text-[#0a0a0a] text-xs font-medium px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5">
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
