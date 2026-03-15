"use client";

import Link from "next/link";
import { PhoneMockup } from "./PhoneMockup";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Subtle coral→peach gradient at top */}
      <div className="absolute inset-0 coral-gradient-subtle opacity-60" />

      {/* Floating ambient decorations */}
      <div className="absolute top-32 left-[10%] w-16 h-16 bg-coral-tint rounded-2xl rotate-12 opacity-40 animate-float" />
      <div className="absolute bottom-40 right-[8%] w-12 h-12 bg-coral-soft rounded-full opacity-30 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-[60%] left-[5%] w-8 h-8 bg-coral-tint rounded-xl -rotate-12 opacity-25 animate-float" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Copy */}
        <div className="flex-1 text-center lg:text-left stagger-children">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[0.95] tracking-tight text-warm-text">
            Shop what creators
            <br />
            <span className="gradient-text">actually wear.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-warm-secondary max-w-lg leading-relaxed">
            A TikTok-style feed where every product is real, every creator is authentic, and checkout never leaves the app. No redirects. No broken links. Just scroll, tap, buy.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center px-8 py-4 bg-coral text-white font-semibold text-base rounded-full transition-all duration-300 hover:bg-coral-hover hover:scale-[1.02] shadow-lg shadow-coral/20"
            >
              Start Scrolling
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 text-warm-text font-medium text-base rounded-full border-2 border-warm-border hover:border-coral hover:text-coral transition-all duration-300"
            >
              Apply as Creator
            </Link>
          </div>
        </div>

        {/* Phone */}
        <div className="flex-shrink-0 relative">
          <PhoneMockup />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <svg className="w-5 h-5 text-warm-secondary animate-swipe-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      </div>
    </section>
  );
}
