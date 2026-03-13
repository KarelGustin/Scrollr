"use client";

import { ScrollReveal } from "./ScrollReveal";

const trustSignals = [
  {
    title: "Verified Creators",
    description: "Every creator is reviewed before joining. You shop from real people with real audiences.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: "Secure Checkout",
    description: "Industry-standard encryption and secure payment processing. Your data is always protected.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    title: "Easy Returns",
    description: "Not happy with a purchase? Our return policy makes it simple to get your money back.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
      </svg>
    ),
  },
];

export function TrustSection() {
  return (
    <section className="py-24 sm:py-32 px-6 bg-warm-surface">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-coral tracking-wider uppercase mb-4">
              Trust & Safety
            </p>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-warm-text leading-tight">
              Shop with confidence
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {trustSignals.map((signal, i) => (
            <ScrollReveal key={signal.title} delay={150 + i * 120}>
              <div className="bg-warm-card rounded-2xl p-8 border border-warm-border text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-14 h-14 rounded-2xl bg-coral-tint flex items-center justify-center text-coral mx-auto mb-6">
                  {signal.icon}
                </div>
                <h3 className="text-lg font-display font-bold text-warm-text mb-3">
                  {signal.title}
                </h3>
                <p className="text-warm-secondary leading-relaxed">
                  {signal.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
