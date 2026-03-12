"use client";

import Link from "next/link";
import { PhoneMockup } from "./PhoneMockup";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-[600px] h-[600px] bg-accent/20 top-[-200px] left-[-200px] animate-glow-pulse" />
      <div className="orb w-[500px] h-[500px] bg-accent/10 bottom-[-150px] right-[-150px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="orb w-[300px] h-[300px] bg-purple-500/10 top-[30%] right-[10%] animate-glow-pulse" style={{ animationDelay: "4s" }} />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Copy */}
        <div className="flex-1 text-center lg:text-left stagger-children">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
            <span className="text-xs font-medium text-accent tracking-wide uppercase">Now in beta</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold leading-[0.95] tracking-tight">
            Make affiliate
            <br />
            marketing
            <br />
            <span className="gradient-text">fun again.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl leading-relaxed">
            Don&apos;t gatekeep your essentials. Share them in a full-screen, swipeable feed your followers actually love.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-fg font-semibold text-base rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)] hover:scale-[1.02]"
            >
              <span className="relative z-10">Start for free</span>
              <svg className="relative z-10 w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 text-text/80 font-medium text-base rounded-2xl border border-border hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300"
            >
              See how it works
            </a>
          </div>

          <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start">
            <div className="flex -space-x-2">
              {["from-violet-500 to-blue-500", "from-pink-500 to-rose-500", "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500"].map((gradient, i) => (
                <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-bg`} />
              ))}
            </div>
            <p className="text-sm text-muted">
              <span className="text-text font-medium">2,400+</span> creators already in
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex-shrink-0 relative">
          {/* Glow behind phone */}
          <div className="absolute inset-0 -m-12 bg-accent/10 rounded-full blur-[100px] animate-glow-pulse" />
          <PhoneMockup />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-swipe-hint">
        <span className="text-xs text-muted/60 tracking-widest uppercase">Scroll</span>
        <svg className="w-4 h-4 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      </div>
    </section>
  );
}
