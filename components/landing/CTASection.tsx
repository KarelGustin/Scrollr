"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function CTASection() {
  return (
    <section className="py-32 px-6 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
            Content that inspires.
            <br />
            <span className="text-white/50">Commerce that feels natural.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mt-8 text-lg text-white/60 leading-relaxed max-w-xl mx-auto">
            Welcome to the next generation of creator-led shopping.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0a0a0a] font-semibold text-base rounded-full transition-all duration-300 hover:bg-white/90 hover:scale-[1.02]"
            >
              Apply for early creator access
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
