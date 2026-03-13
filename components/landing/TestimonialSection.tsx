"use client";

import { ScrollReveal } from "./ScrollReveal";

const testimonials = [
  {
    quote: "I used to spend hours crafting promo posts. Now I just upload my usual content and Scrollr handles the rest. My audience actually thanks me for the recommendations.",
    name: "Emma K.",
    role: "Fashion Creator",
    avatar: "E",
    avatarBg: "bg-coral",
  },
  {
    quote: "The shopping experience feels so natural. I found three things I wanted to buy just by scrolling for 10 minutes. It's dangerously addictive.",
    name: "Mia R.",
    role: "Early Shopper",
    avatar: "M",
    avatarBg: "bg-social",
  },
  {
    quote: "My conversion rates tripled compared to link-in-bio tools. People buy when they see the product in context, not when they're searching for it.",
    name: "Jordan T.",
    role: "Lifestyle Creator",
    avatar: "J",
    avatarBg: "bg-success",
  },
];

export function TestimonialSection() {
  return (
    <section className="py-24 sm:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-coral tracking-wider uppercase mb-4">
              What people say
            </p>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-warm-text leading-tight">
              Loved by creators and shoppers
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <ScrollReveal key={testimonial.name} delay={150 + i * 120}>
              <div className="bg-warm-card rounded-2xl p-8 border border-warm-border h-full flex flex-col">
                {/* Quote mark */}
                <svg className="w-8 h-8 text-coral/30 mb-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
                </svg>

                <p className="text-warm-secondary leading-relaxed flex-1 mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${testimonial.avatarBg} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-display font-bold text-warm-text">{testimonial.name}</p>
                    <p className="text-xs text-warm-muted">{testimonial.role}</p>
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
