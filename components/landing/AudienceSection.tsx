"use client";

import { ScrollReveal } from "./ScrollReveal";

export function AudienceSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[#9ca3af] tracking-wider uppercase mb-6">
            A better experience for your audience
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0a0a0a] leading-tight">
            It feels like social media.
          </h2>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#9ca3af] leading-tight mt-2">
            But it&apos;s built for shopping.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-12 space-y-6 text-lg text-[#6b7280] leading-relaxed">
            <p>Scroller is designed to feel instantly familiar.</p>
            <div className="py-2">
              <p className="text-[#0a0a0a]">Vertical videos.</p>
              <p className="text-[#0a0a0a]">Simple scrolling.</p>
              <p className="text-[#0a0a0a]">Minimal interface.</p>
            </div>
            <p>But when someone sees something they want — they can act instantly.</p>
            <p>No searching. No leaving the experience.</p>
            <p className="text-[#0a0a0a] font-medium">Just scroll, discover, shop.</p>
          </div>
        </ScrollReveal>

        {/* Phone scroll animation */}
        <ScrollReveal delay={300}>
          <div className="mt-16 flex justify-center">
            <div className="w-[220px] h-[420px] rounded-[36px] border-[3px] border-black/10 bg-gradient-to-b from-[#f9fafb] to-white overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-black rounded-b-2xl z-10" />

              {/* Scrolling videos */}
              <div className="absolute inset-0 pt-8 space-y-1 p-2">
                {[
                  { color: "from-rose-200 to-pink-200", label: "Outfit" },
                  { color: "from-sky-200 to-indigo-200", label: "Routine" },
                  { color: "from-emerald-200 to-teal-200", label: "Haul" },
                ].map((v) => (
                  <div key={v.label} className={`h-[120px] rounded-2xl bg-gradient-to-br ${v.color} flex items-end p-3`}>
                    <div className="flex gap-1">
                      {[1, 2].map((n) => (
                        <div key={n} className="w-10 h-6 bg-white/80 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
