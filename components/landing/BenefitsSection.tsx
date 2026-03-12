"use client";

import { ScrollReveal } from "./ScrollReveal";

const BENEFITS = [
  {
    label: "Share everything",
    items: [
      {
        stat: "3.2x",
        description: "More clicks than link-in-bio",
        detail: "Full-screen video builds intent. They don't just click — they watch, want, then buy. Stop gatekeeping your favorites.",
      },
      {
        stat: "0",
        description: "Cringe \"use my code\" posts",
        detail: "Your main feed stays you. Scrollr lives on a separate link — sharing your essentials without polluting your content.",
      },
      {
        stat: "Fun",
        description: "The way sharing should feel",
        detail: "Your followers browse your picks like they scroll TikTok. It's not a sales pitch — it's a curated experience they'll actually thank you for.",
      },
    ],
  },
  {
    label: "Monetize effortlessly",
    items: [
      {
        stat: "8.2%",
        description: "Average click-through rate",
        detail: "The swipe-to-shop format holds attention. Brands see click rates 4x higher than traditional affiliate pages.",
      },
      {
        stat: "$$$",
        description: "Real revenue, not vanity metrics",
        detail: "Views, watch time, clicks, conversions — see exactly which products earn. Share reports with brands in seconds.",
      },
      {
        stat: "Any",
        description: "Affiliate network, any brand",
        detail: "Amazon, LTK, ShareASale, direct brand deals — paste any link and we track it. No platform lock-in, ever.",
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
              Don&apos;t gatekeep
              <br />
              <span className="text-muted">your essentials.</span>
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
