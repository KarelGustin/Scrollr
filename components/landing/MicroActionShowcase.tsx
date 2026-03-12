"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Animated cursor + click ring ─── */
function AnimatedCursor({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute z-30 pointer-events-none ${className}`}>
      {/* cursor */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
        <path
          d="M5 3l14 8-6 2-3 6-5-16z"
          fill="white"
          stroke="#09090b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ─── 1. Drop & Upload showcase ─── */
function UploadDemo() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const cycle = () => {
      setPhase(0);
      const t1 = setTimeout(() => setPhase(1), 800);
      const t2 = setTimeout(() => setPhase(2), 2000);
      const t3 = setTimeout(() => setPhase(3), 3400);
      const t4 = setTimeout(() => setPhase(0), 5400);
      return [t1, t2, t3, t4];
    };
    let timers = cycle();
    const interval = setInterval(() => {
      timers = cycle();
    }, 5500);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-muted ml-2">Add product</span>
      </div>

      {/* Drop zone */}
      <div className="p-4">
        <div
          className={`relative h-32 rounded-xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-2 ${
            phase >= 1 ? "border-accent/60 bg-accent/5" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          {phase < 2 && (
            <>
              <div className={`w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center transition-transform duration-300 ${phase >= 1 ? "scale-110" : ""}`}>
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-[11px] text-muted">{phase >= 1 ? "Release to upload" : "Drop your video here"}</p>
            </>
          )}

          {phase >= 2 && (
            <div className="flex flex-col items-center gap-3 animate-drop-in">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              </div>
              <span className="text-[11px] text-text/70">glow_serum_review.mp4</span>
            </div>
          )}

          {/* Animated cursor */}
          {phase === 1 && (
            <AnimatedCursor className="top-2 right-8 animate-cursor-move" />
          )}
        </div>

        {/* Progress bar */}
        {phase >= 2 && (
          <div className="mt-3 space-y-1.5 animate-drop-in" style={{ animationDelay: "200ms" }}>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted">Uploading...</span>
              <span className="text-accent">{phase >= 3 ? "Done" : "67%"}</span>
            </div>
            <div className="h-1.5 bg-card rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${phase >= 3 ? "w-full bg-accent" : "w-2/3 bg-accent/70"}`}
                style={{ backgroundImage: phase < 3 ? "linear-gradient(90deg, #c8ff00, #a3e600, #c8ff00)" : undefined, backgroundSize: "200% 100%", animation: phase < 3 ? "shimmer 2s ease-in-out infinite" : undefined }}
              />
            </div>
          </div>
        )}

        {/* Success toast */}
        {phase >= 3 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 animate-drop-in">
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="text-[11px] text-accent">Video uploaded &amp; encoded</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 2. Add link showcase ─── */
function AddLinkDemo() {
  const [phase, setPhase] = useState(0);
  const urlRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cycle = () => {
      setPhase(0);
      const t1 = setTimeout(() => setPhase(1), 600);
      const t2 = setTimeout(() => setPhase(2), 2400);
      const t3 = setTimeout(() => setPhase(3), 3800);
      const t4 = setTimeout(() => setPhase(0), 5800);
      return [t1, t2, t3, t4];
    };
    let timers = cycle();
    const interval = setInterval(() => {
      timers = cycle();
    }, 5900);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-muted ml-2">Product details</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Product name field */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted uppercase tracking-wider">Product name</div>
          <div className="h-9 bg-card rounded-lg border border-border flex items-center px-3">
            <span className="text-sm text-text/80">Glow Serum</span>
          </div>
        </div>

        {/* Affiliate URL - animated typing */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted uppercase tracking-wider">Affiliate URL</div>
          <div className="h-9 bg-card rounded-lg border border-border flex items-center px-3 overflow-hidden relative">
            {phase >= 1 ? (
              <span ref={urlRef} className="text-sm text-accent/70 inline-block overflow-hidden whitespace-nowrap" style={{ animation: "typing 1.8s steps(28, end) forwards", width: 0 }}>
                https://glossier.com/ref=luna
              </span>
            ) : (
              <span className="text-sm text-muted/40">Paste your link...</span>
            )}
            {phase >= 1 && phase < 2 && (
              <span className="text-accent animate-blink ml-0.5">|</span>
            )}
          </div>
        </div>

        {/* Price + Save */}
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-card rounded-lg border border-border flex items-center px-3">
            <span className="text-sm text-text/80">$34</span>
          </div>
          <button
            className={`h-9 px-4 rounded-lg flex items-center transition-all duration-300 ${
              phase >= 2
                ? "bg-accent scale-105 shadow-[0_0_20px_rgba(200,255,0,0.3)]"
                : "bg-card border border-border"
            }`}
          >
            <span className={`text-xs font-semibold transition-colors duration-300 ${phase >= 2 ? "text-accent-fg" : "text-muted"}`}>
              Save
            </span>
          </button>
        </div>

        {/* Tracking link generated */}
        {phase >= 3 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 animate-drop-in">
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-4.318a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 1 0-6.364 6.364l1.757 1.757" />
            </svg>
            <span className="text-[10px] text-accent truncate">scrollr.io/r/glow-serum-a8f3</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 3. Swipe-to-shop showcase ─── */
function SwipeDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const products = [
    { name: "Cloud Sneakers", brand: "@jakefits", price: "$189", gradient: "from-violet-600 to-blue-500" },
    { name: "Glow Serum", brand: "@lunabeauty", price: "$34", gradient: "from-pink-500 to-orange-400" },
    { name: "Minimal Watch", brand: "@avastyle", price: "$229", gradient: "from-emerald-500 to-teal-400" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSwiping(true);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % products.length);
        setSwiping(false);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, [products.length]);

  const product = products[activeIndex];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {/* Phone shell */}
      <div className="relative w-full h-full rounded-2xl border-2 border-white/10 bg-black overflow-hidden">
        {/* Video background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${product.gradient} transition-all duration-500 ${
            swiping ? "opacity-0 translate-y-[-30%]" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full bg-white/10 animate-morph" />
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

        {/* Creator tag */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-emerald-400" />
          <span className="text-[10px] text-white font-medium">{product.brand}</span>
        </div>

        {/* Product info */}
        <div
          className={`absolute bottom-3 left-3 right-3 z-20 transition-all duration-500 ${
            swiping ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          <p className="text-white text-sm font-semibold">{product.name}</p>
          <p className="text-accent text-xs font-bold mt-0.5">{product.price}</p>
          <div className="mt-2 w-full py-1.5 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-accent-fg text-[10px] font-semibold">Shop Now</span>
          </div>
        </div>

        {/* Swipe hand indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 animate-hand-swipe">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.5">
            <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 4.46 13.54 2 10.5 2S5 4.46 5 7.5c0 1.56.79 2.93 2 3.74V7.5a2.5 2.5 0 0 1 2-2.45v5.69l-1.9-.95A1.5 1.5 0 0 0 5 11.24V17c0 2.76 2.24 5 5 5h4c2.76 0 5-2.24 5-5v-3.5a1.5 1.5 0 0 0-2.1-1.38L9 11.24z" />
          </svg>
        </div>

        {/* Page dots */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          {products.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-3 bg-white" : "w-1 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 4. Analytics showcase ─── */
function AnalyticsDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const views = 12847 + tick * 3;
  const clicks = 1053 + Math.floor(tick * 0.4);
  const revenue = 2841 + tick * 2;

  const bars = [
    { label: "Mon", height: "45%" },
    { label: "Tue", height: "62%" },
    { label: "Wed", height: "38%" },
    { label: "Thu", height: "75%" },
    { label: "Fri", height: "90%" },
    { label: "Sat", height: "68%" },
    { label: "Sun", height: "55%" },
  ];

  return (
    <div className="relative w-full h-full rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] text-muted ml-2">Analytics</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
          <span className="text-[9px] text-green-400">Live</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-border/50 border-b border-border">
        {[
          { label: "Views", value: views.toLocaleString(), color: "text-text" },
          { label: "Clicks", value: clicks.toLocaleString(), color: "text-blue-400" },
          { label: "Revenue", value: `$${revenue.toLocaleString()}`, color: "text-accent" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface px-3 py-3 text-center">
            <div className={`text-sm font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
            <div className="text-[9px] text-muted mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-end gap-1.5 h-20">
          {bars.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative" style={{ height: "64px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-sm bg-accent/70 transition-all duration-700"
                  style={{
                    height: bar.height,
                    animation: `bar-grow 1s ease-out ${i * 100}ms forwards`,
                    ["--bar-height" as string]: bar.height,
                  }}
                />
              </div>
              <span className="text-[8px] text-muted">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live notification */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-accent/5 border border-accent/10">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          <span className="text-[9px] text-accent/80">+3 clicks from @lunabeauty&apos;s Glow Serum</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main showcase section ─── */
export function MicroActionShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showcases = [
    {
      tag: "Upload",
      title: "Drop a video, we handle the rest",
      description: "Record a quick product video — just like a Reel. Drag it in and we encode, optimize, and host it globally via Cloudflare.",
      component: <UploadDemo />,
    },
    {
      tag: "Link",
      title: "Paste your affiliate link",
      description: "Add the product URL and we wrap it in a trackable redirect. Every single tap is measured.",
      component: <AddLinkDemo />,
    },
    {
      tag: "Swipe",
      title: "Followers swipe to shop",
      description: "Your feed feels like TikTok, not a spreadsheet. They watch, want, and buy — without leaving the experience.",
      component: <SwipeDemo />,
    },
    {
      tag: "Track",
      title: "See every click in real time",
      description: "Views, watch time, click-through rate, revenue. Data you can actually share with brands.",
      component: <AnalyticsDemo />,
    },
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="section-divider mb-32" />

      {/* Background orb */}
      <div className="orb w-[500px] h-[500px] bg-accent/5 top-[20%] left-[-200px]" />
      <div className="orb w-[400px] h-[400px] bg-purple-500/5 bottom-[10%] right-[-150px]" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div
          className={`text-center mb-24 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">How it works</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight">
            Four micro-actions.
            <br />
            <span className="text-muted">Infinite revenue.</span>
          </h2>
        </div>

        {/* Showcase grid — alternating layout */}
        <div className="space-y-32">
          {showcases.map((item, i) => (
            <ShowcaseRow key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseRow({ item, index }: { item: { tag: string; title: string; description: string; component: React.ReactNode }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isReversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} gap-12 md:gap-20 items-center transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      {/* Text */}
      <div className="flex-1 space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
          <span className="text-[10px] font-semibold text-accent tracking-widest uppercase">{item.tag}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-text leading-tight">{item.title}</h3>
        <p className="text-base sm:text-lg text-muted leading-relaxed max-w-md">{item.description}</p>
      </div>

      {/* Animated visual */}
      <div className="flex-1 w-full max-w-md h-[320px]">
        {item.component}
      </div>
    </div>
  );
}
