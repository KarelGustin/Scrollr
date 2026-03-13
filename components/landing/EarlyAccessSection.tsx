"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function EarlyAccessSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <p className="text-sm font-medium text-[#9ca3af] tracking-wider uppercase mb-6">
            Early Creator Access
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0a0a0a] leading-tight">
            Be among the first creators on Scroller.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-8 text-lg text-[#6b7280] leading-relaxed max-w-xl mx-auto">
            We&apos;re opening the platform to a small group of early creators.
            Creators who want a cleaner way to turn content into commerce.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#0a0a0a] text-white font-semibold text-base rounded-full transition-all duration-300 hover:bg-[#1a1a1a] hover:scale-[1.02]"
            >
              Join as a Creator
            </Link>
            <p className="mt-4 text-sm text-[#9ca3af]">
              Early creators get priority discovery and featured placement.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
