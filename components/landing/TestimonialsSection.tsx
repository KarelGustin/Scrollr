"use client";

import { ScrollReveal } from "./ScrollReveal";

const TESTIMONIALS = [
  {
    quote: "I replaced my Linktree with Scrollr and my affiliate revenue tripled in a month. The video format just hits different.",
    name: "Luna Martinez",
    handle: "@lunabeauty",
    gradient: "from-pink-500 to-rose-400",
    metric: "3.2x revenue",
  },
  {
    quote: "Finally, my brand deals come with actual data. I can show sponsors exactly how many people watched, clicked, and bought.",
    name: "Jake Chen",
    handle: "@jakefits",
    gradient: "from-blue-500 to-cyan-400",
    metric: "12% avg CTR",
  },
  {
    quote: "My followers actually thank me for the recommendations now. It feels like browsing, not selling. That's the magic.",
    name: "Ava Williams",
    handle: "@avastyle",
    gradient: "from-violet-500 to-purple-400",
    metric: "48k views/week",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="section-divider mb-32" />

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">Creators love it</p>
            <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
              Don&apos;t take our word for it
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={i} delay={i * 120}>
              <div className="glass-card rounded-2xl p-8 h-full flex flex-col justify-between group hover:border-accent/10 transition-all duration-500">
                <div>
                  <div className="flex items-center gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-text/80 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient}`} />
                    <div>
                      <p className="text-sm font-medium text-text">{t.name}</p>
                      <p className="text-xs text-muted">{t.handle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{t.metric}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
