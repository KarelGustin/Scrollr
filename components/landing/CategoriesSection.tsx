"use client";

import { ScrollReveal } from "./ScrollReveal";

const categories = [
  "Fashion",
  "Lifestyle",
  "Beauty",
  "Tech",
  "Home",
  "Accessories",
];

export function CategoriesSection() {
  return (
    <section className="py-24 px-6 bg-[#f9fafb]">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <p className="text-sm font-medium text-[#9ca3af] tracking-wider uppercase mb-6">
            Built for creators in
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {categories.map((cat, i) => (
              <span
                key={cat}
                className="px-6 py-3 text-lg font-display font-semibold text-[#0a0a0a] border border-black/[0.06] rounded-full bg-white"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {cat}
              </span>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <p className="mt-12 text-[#6b7280] text-base max-w-lg mx-auto leading-relaxed">
            If your content inspires people to buy what you wear, use, or recommend — Scroller is for you.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
