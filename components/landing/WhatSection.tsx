"use client";

import { ScrollReveal } from "./ScrollReveal";

export function WhatSection() {
  return (
    <section className="py-32 px-6 bg-[#f9fafb]">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[#9ca3af] tracking-wider uppercase mb-6">
            What Scroller does
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0a0a0a] leading-tight">
            A shopping layer for your content.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-12 space-y-6 text-lg text-[#6b7280] leading-relaxed">
            <p>You post the same content you already make.</p>
            <div className="py-2">
              <p className="text-[#0a0a0a]">Outfits.</p>
              <p className="text-[#0a0a0a]">Product moments.</p>
              <p className="text-[#0a0a0a]">Daily routines.</p>
            </div>
            <p>Scroller simply lets people shop what they see.</p>
            <p>No extra work. No awkward selling.</p>
          </div>
        </ScrollReveal>

        {/* Inline animation: video with products sliding in */}
        <ScrollReveal delay={300}>
          <div className="mt-16 relative max-w-sm mx-auto">
            <div className="aspect-[9/16] rounded-3xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 overflow-hidden relative">
              {/* Simulated video content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Gradient bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Product row */}
              <div className="absolute bottom-4 left-3 right-3 flex gap-2">
                {["Top", "Pants", "Shoes"].map((item) => (
                  <div key={item} className="flex-1 bg-white/90 backdrop-blur rounded-xl p-2">
                    <div className="h-10 bg-[#f3f4f6] rounded-lg mb-1.5" />
                    <p className="text-[9px] font-medium text-[#0a0a0a]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-[#6b7280] text-base leading-relaxed">
                Content stays beautiful.<br />
                Shopping happens underneath.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
