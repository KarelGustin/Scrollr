"use client";

import { ScrollReveal } from "./ScrollReveal";

const PROBLEMS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "You're hiding your best finds",
    description: "Your followers literally DM you asking \"where'd you get that?\" but you're gatekeeping because there's no good way to share everything at once.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    ),
    title: "Link-in-bio is a graveyard",
    description: "A wall of tiny links nobody clicks. No video, no context, no vibe. Your audience taps out before they even find the product.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ),
    title: "Affiliate marketing feels cringe",
    description: "Salesy Reels, awkward \"use my code\" CTAs, links that go nowhere. It doesn't have to feel like that.",
  },
];

export function ProblemSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="section-divider mb-32" />

      <div className="max-w-5xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-20">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">The problem</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight">
              Sharing shouldn&apos;t
              <br />
              <span className="text-muted">feel like selling.</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((problem, i) => (
            <ScrollReveal key={i} delay={i * 120}>
              <div className="glass-card rounded-2xl p-8 h-full group hover:border-accent/20 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:bg-accent/20 transition-colors duration-500">
                  {problem.icon}
                </div>
                <h3 className="text-lg font-semibold text-text mb-3 leading-snug">{problem.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{problem.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
