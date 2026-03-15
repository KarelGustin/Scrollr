"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 px-6 coral-gradient-bg relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-[10%] w-32 h-32 rounded-full border-2 border-white/30" />
        <div className="absolute bottom-16 right-[15%] w-24 h-24 rounded-full border-2 border-white/20" />
        <div className="absolute top-1/2 left-[60%] w-16 h-16 rounded-full border-2 border-white/25" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
            Your store could be live in 30 seconds.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            Merchants: install the Shopify app. Creators: apply to start earning. Shoppers: your feed is waiting.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-coral font-semibold text-base rounded-full transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] shadow-lg"
            >
              Start Scrolling
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 text-white font-medium text-base rounded-full border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all duration-300"
            >
              Apply as Creator
            </Link>
            <Link
              href="/merchant-register"
              className="inline-flex items-center justify-center px-8 py-4 text-white font-medium text-base rounded-full border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all duration-300"
            >
              Install Shopify App
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
