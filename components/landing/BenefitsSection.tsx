"use client";

import { ScrollReveal } from "./ScrollReveal";

const BENEFITS = [
  {
    label: "For Creators",
    items: [
      {
        stat: "3.2x",
        description: "Higher conversion than link-in-bio",
        detail: "Full-screen video builds intent. They don't just click — they watch, want, then buy.",
      },
      {
        stat: "0",
        description: "Salesy posts on your main feed",
        detail: "Your Reels stay authentic. Scrollr lives on a separate link — your followers only see it when they choose to.",
      },
      {
        stat: "Real",
        description: "Revenue data you can actually use",
        detail: "See exactly which products convert, which videos drive clicks, and what your CTR looks like — not vanity likes.",
      },
    ],
  },
  {
    label: "For Brands",
    items: [
      {
        stat: "8.2%",
        description: "Average click-through rate",
        detail: "The swipe-to-shop format keeps attention. Brands see click rates 4x higher than traditional affiliate pages.",
      },
      {
        stat: "Full",
        description: "Funnel visibility for sponsors",
        detail: "Views, watch time, clicks, conversions — all in one dashboard. Share reports with brands in seconds.",
      },
      {
        stat: "Native",
        description: "Experience that feels like social",
        detail: "No jarring redirects to ugly landing pages. Followers stay in a format they already love — short-form video.",
      },
    ],
  },
];

export function BenefitsSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="section-divider mb-32" />

      <div className="orb w-[500px] h-[500px] bg-purple-500/5 bottom-[10%] right-[-200px]" />

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-20">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">Why Scrollr</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight">
              Better for creators.
              <br />
              <span className="text-muted">Better for brands.</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-20">
          {BENEFITS.map((group, gi) => (
            <div key={gi}>
              <ScrollReveal>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted tracking-widest uppercase px-4">{group.label}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </ScrollReveal>

              <div className="grid gap-6 md:grid-cols-3">
                {group.items.map((item, i) => (
                  <ScrollReveal key={i} delay={i * 120}>
                    <div className="glass-card rounded-2xl p-8 h-full group hover:border-accent/20 transition-all duration-500 relative overflow-hidden">
                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-accent/5 to-transparent" />

                      <div className="relative">
                        <div className="text-4xl font-display font-bold gradient-text mb-2 inline-block">
                          {item.stat}
                        </div>
                        <h3 className="text-base font-semibold text-text mb-3">{item.description}</h3>
                        <p className="text-sm text-muted leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
