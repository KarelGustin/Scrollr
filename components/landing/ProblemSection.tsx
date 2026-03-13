"use client";

import { ScrollReveal } from "./ScrollReveal";

export function ProblemSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[#9ca3af] tracking-wider uppercase mb-6">
            The problem
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0a0a0a] leading-tight">
            Creators shouldn&apos;t have to sell like advertisers.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-12 space-y-6 text-lg text-[#6b7280] leading-relaxed">
            <p>Posting great content is easy.</p>
            <p>Monetizing it without ruining it isn&apos;t.</p>
            <div className="py-4">
              <p className="text-[#0a0a0a]">Promo captions.</p>
              <p className="text-[#0a0a0a]">Discount codes.</p>
              <p className="text-[#0a0a0a]">Link-in-bio gymnastics.</p>
            </div>
            <p>It works. But it doesn&apos;t feel right.</p>
            <p className="text-[#0a0a0a] font-medium text-xl">Scroller changes that.</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
