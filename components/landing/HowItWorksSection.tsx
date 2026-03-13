"use client";

import { ScrollReveal } from "./ScrollReveal";

const steps = [
  {
    number: "01",
    title: "Upload your video",
    lines: ["Fitchecks.", "Styling clips.", "Product moments.", "", "Anything that shows your style."],
  },
  {
    number: "02",
    title: "Tag the products",
    lines: ["Add the items featured in your video.", "", "They appear subtly beneath the content."],
  },
  {
    number: "03",
    title: "Your audience shops naturally",
    lines: ["People discover products while watching.", "", "They add to cart.", "They keep scrolling.", "", "No disruption."],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[#9ca3af] tracking-wider uppercase mb-6">
            How it works
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0a0a0a] leading-tight mb-20">
            Post. Tag. Earn.
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={200 + i * 150}>
              <div>
                <span className="text-sm font-medium text-[#d1d5db] mb-4 block">
                  {step.number}
                </span>
                <h3 className="text-xl font-display font-bold text-[#0a0a0a] mb-4">
                  {step.title}
                </h3>
                <div className="space-y-1">
                  {step.lines.map((line, j) =>
                    line === "" ? (
                      <div key={j} className="h-3" />
                    ) : (
                      <p key={j} className="text-[#6b7280] leading-relaxed">
                        {line}
                      </p>
                    )
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA after how it works */}
        <ScrollReveal delay={700}>
          <div className="mt-20 text-center">
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
