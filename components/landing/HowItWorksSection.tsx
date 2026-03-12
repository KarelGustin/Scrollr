"use client";

import { ScrollReveal } from "./ScrollReveal";

const STEPS = [
  {
    number: "01",
    title: "Upload your videos",
    description: "Record a short product video — just like a Reel. Drag, drop, done. We handle encoding, hosting, and delivery globally via Cloudflare.",
    visual: (
      <div className="relative w-full h-48 rounded-xl bg-surface overflow-hidden border border-border">
        {/* Upload zone simulation */}
        <div className="absolute inset-4 rounded-lg border-2 border-dashed border-accent/30 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-xs text-muted">Drop your video here</p>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="h-1 bg-card rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full w-2/3 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, #c8ff00, #a3e600, #c8ff00)", backgroundSize: "200% 100%" }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    title: "Add your affiliate links",
    description: "Paste the product link, add name and price. We wrap it in a trackable redirect so you see every single click.",
    visual: (
      <div className="relative w-full h-48 rounded-xl bg-surface overflow-hidden border border-border p-5 space-y-3">
        <div className="space-y-2">
          <div className="text-[10px] text-muted uppercase tracking-wider">Product name</div>
          <div className="h-9 bg-card rounded-lg border border-border flex items-center px-3">
            <span className="text-sm text-text/80">Cloud Sneakers</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] text-muted uppercase tracking-wider">Affiliate URL</div>
          <div className="h-9 bg-card rounded-lg border border-border flex items-center px-3">
            <span className="text-sm text-accent/70 truncate">https://nike.com/ref=luna...</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-card rounded-lg border border-border flex items-center px-3">
            <span className="text-sm text-text/80">$189</span>
          </div>
          <div className="h-9 px-4 bg-accent rounded-lg flex items-center">
            <span className="text-xs font-semibold text-accent-fg">Save</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    title: "Share one link",
    description: "Drop scrollr.io/@you in your bio. Your followers get a full-screen, addictive swipe experience — and you get revenue data in real time.",
    visual: (
      <div className="relative w-full h-48 rounded-xl bg-surface overflow-hidden border border-border flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-emerald-400" />
          <div>
            <div className="text-sm font-medium text-text">scrollr.io/@luna</div>
            <div className="text-[10px] text-muted">Your shoppable feed</div>
          </div>
          <div className="ml-4 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-lg font-bold text-text">12.4k</div>
            <div className="text-[10px] text-muted">Views</div>
          </div>
          <div className="w-px bg-border" />
          <div>
            <div className="text-lg font-bold text-accent">8.2%</div>
            <div className="text-[10px] text-muted">CTR</div>
          </div>
          <div className="w-px bg-border" />
          <div>
            <div className="text-lg font-bold text-text">$1,840</div>
            <div className="text-[10px] text-muted">Revenue</div>
          </div>
        </div>
      </div>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="section-divider mb-32" />

      {/* Background accent */}
      <div className="orb w-[400px] h-[400px] bg-accent/5 top-[20%] left-[-100px]" />

      <div className="max-w-5xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-20">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">How it works</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight">
              Three steps.
              <br />
              <span className="text-muted">Zero friction.</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-20">
          {STEPS.map((step, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-10 md:gap-16 items-center`}>
                <div className="flex-1 space-y-4">
                  <span className="text-5xl font-display font-bold text-accent/20">{step.number}</span>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-text">{step.title}</h3>
                  <p className="text-base text-muted leading-relaxed max-w-md">{step.description}</p>
                </div>
                <div className="flex-1 w-full max-w-md">
                  {step.visual}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
