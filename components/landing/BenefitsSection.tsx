"use client";

import { ScrollReveal } from "./ScrollReveal";

const benefits = [
  {
    title: "No promo clutter",
    description: 'No "use my code". No awkward captions. Your content stays clean.',
  },
  {
    title: "Monetize what you already post",
    description: "Your fitchecks, styling clips and product videos already inspire people. Scroller simply captures that moment.",
  },
  {
    title: "Earn through real discovery",
    description: "Your audience doesn't need to search. They see it. They want it. They add it.",
  },
  {
    title: "Simple creator dashboard",
    description: "Upload videos. Add products. Track what performs. That's it.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-32 px-6 bg-[#f9fafb]">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[#9ca3af] tracking-wider uppercase mb-6">
            Why creators love it
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0a0a0a] leading-tight mb-20">
            Finally, a cleaner way to monetize.
          </h2>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-12">
          {benefits.map((benefit, i) => (
            <ScrollReveal key={benefit.title} delay={200 + i * 120}>
              <div>
                <h3 className="text-lg font-display font-bold text-[#0a0a0a] mb-3">
                  {benefit.title}
                </h3>
                <p className="text-[#6b7280] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Dashboard animation */}
        <ScrollReveal delay={700}>
          <div className="mt-20 max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
              <div className="grid grid-cols-4 gap-4 text-center">
                {[
                  { label: "Views", value: "12.4k" },
                  { label: "Clicks", value: "1.8k" },
                  { label: "Add to cart", value: "340" },
                  { label: "Earnings", value: "\u20AC284" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-display font-bold text-[#0a0a0a]">{stat.value}</p>
                    <p className="text-[10px] text-[#9ca3af] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={800}>
          <div className="mt-16 text-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#0a0a0a] text-white font-semibold text-base rounded-full transition-all duration-300 hover:bg-[#1a1a1a] hover:scale-[1.02]"
            >
              Join as a Creator
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
