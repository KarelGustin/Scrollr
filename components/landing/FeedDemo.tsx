"use client";

import { PhoneMockup } from "./PhoneMockup";
import { ScrollReveal } from "./ScrollReveal";

export function FeedDemo() {
  return (
    <section className="py-24 sm:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <p className="text-sm font-semibold text-coral tracking-wider uppercase mb-4">
            The experience
          </p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-warm-text leading-tight mb-4">
            Shopping that feels like scrolling your favorite feed.
          </h2>
          <p className="text-lg text-warm-secondary max-w-xl mx-auto leading-relaxed mb-16">
            Watch creators you love. Discover products that match your style. Add to cart without ever leaving the video.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="relative inline-block">
            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-coral/10 rounded-[60px] blur-3xl scale-110" />

            {/* Phone */}
            <div className="relative">
              <PhoneMockup />
            </div>

            {/* Floating badges */}
            <div className="absolute -left-8 sm:-left-16 top-1/4 bg-warm-card rounded-2xl px-4 py-3 shadow-lg border border-warm-border animate-float">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-coral flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-warm-text">2.4k likes</span>
              </div>
            </div>

            <div className="absolute -right-8 sm:-right-20 top-[60%] bg-warm-card rounded-2xl px-4 py-3 shadow-lg border border-warm-border animate-float" style={{ animationDelay: "3s" }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-warm-text">Added to cart</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
