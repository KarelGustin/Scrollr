"use client";

import { ScrollReveal } from "./ScrollReveal";

export function ComparisonSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="section-divider mb-32" />

      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">The difference</p>
            <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
              Scrollr vs. everything else
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-5 text-sm font-medium text-muted" />
                  <th className="p-5 text-sm font-medium text-muted text-center">Linktree</th>
                  <th className="p-5 text-sm font-medium text-muted text-center">Instagram Shop</th>
                  <th className="p-5 text-center">
                    <span className="text-sm font-bold text-accent">Scrollr</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["Full-screen video", false, false, true],
                  ["Swipeable feed UX", false, false, true],
                  ["Click-level analytics", false, false, true],
                  ["Keeps main feed clean", true, false, true],
                  ["Works with any affiliate", true, false, true],
                  ["No platform dependency", true, false, true],
                  ["Revenue attribution", false, false, true],
                ].map(([label, lt, ig, sc], i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="p-5 text-text/80 font-medium">{label as string}</td>
                    <td className="p-5 text-center">
                      {lt ? (
                        <span className="text-muted">~</span>
                      ) : (
                        <span className="text-muted/50">—</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {ig ? (
                        <span className="text-muted">~</span>
                      ) : (
                        <span className="text-muted/50">—</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {sc ? (
                        <svg className="w-5 h-5 text-accent mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <span className="text-muted/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
