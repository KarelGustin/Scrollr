"use client";

import Link from "next/link";
import { PhoneMockup } from "./PhoneMockup";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Copy */}
        <div className="flex-1 text-center lg:text-left stagger-children">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[0.95] tracking-tight text-[#0a0a0a]">
            Your content.
            <br />
            Now shoppable.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#6b7280] max-w-lg leading-relaxed">
            Scroller lets your audience discover and shop the products in your videos — without ruining your content with ads, links, or promo codes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#0a0a0a] text-white font-semibold text-base rounded-full transition-all duration-300 hover:bg-[#1a1a1a] hover:scale-[1.02]"
            >
              Join as a Creator
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 text-[#0a0a0a] font-medium text-base rounded-full border border-black/10 hover:border-black/20 hover:bg-black/[0.02] transition-all duration-300"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-sm text-[#9ca3af]">
            Free early access for creators. No followers required.
          </p>
        </div>

        {/* Phone */}
        <div className="flex-shrink-0 relative">
          <PhoneMockup />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <svg className="w-5 h-5 text-[#6b7280] animate-swipe-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      </div>
    </section>
  );
}
