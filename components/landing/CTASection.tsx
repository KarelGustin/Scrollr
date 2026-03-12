"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function CTASection() {
  return (
    <section className="relative py-40 overflow-hidden">
      <div className="section-divider mb-40" />

      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] animate-glow-pulse" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <ScrollReveal>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[0.95]">
            Monetize your work
            <br />
            <span className="gradient-text">for social media.</span>
          </h2>

          <p className="mt-6 text-lg text-muted max-w-lg mx-auto leading-relaxed">
            Your followers already want what you have. Give them a beautiful way to find it — and get paid every time they do.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center px-10 py-5 bg-accent text-accent-fg font-semibold text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.3)] hover:scale-[1.02]"
            >
              <span className="relative z-10">Create your feed</span>
              <svg className="relative z-10 w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted/60">
            No credit card required. 5 products free forever.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
