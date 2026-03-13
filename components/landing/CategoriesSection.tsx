"use client";

import { ScrollReveal } from "./ScrollReveal";

const categories = [
  {
    name: "Fashion",
    gradient: "from-rose-400 to-pink-300",
    emoji: "👗",
  },
  {
    name: "Beauty",
    gradient: "from-fuchsia-400 to-purple-300",
    emoji: "💄",
  },
  {
    name: "Tech",
    gradient: "from-blue-400 to-cyan-300",
    emoji: "📱",
  },
  {
    name: "Home",
    gradient: "from-amber-400 to-orange-300",
    emoji: "🏠",
  },
  {
    name: "Lifestyle",
    gradient: "from-emerald-400 to-teal-300",
    emoji: "🌿",
  },
  {
    name: "Accessories",
    gradient: "from-violet-400 to-indigo-300",
    emoji: "👜",
  },
];

export function CategoriesSection() {
  return (
    <section className="py-24 sm:py-32 px-6 bg-warm-surface">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-coral tracking-wider uppercase mb-4">
              Explore
            </p>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-warm-text leading-tight">
              Explore what&apos;s trending
            </h2>
          </div>
        </ScrollReveal>

        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory -mx-6 px-6">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.name} delay={100 + i * 80}>
              <div className="flex-shrink-0 w-44 sm:w-52 snap-center group cursor-pointer">
                <div className={`relative h-56 sm:h-64 rounded-2xl bg-gradient-to-br ${cat.gradient} overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]`}>
                  {/* Product placeholder grid */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl opacity-60">{cat.emoji}</span>
                  </div>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* Label */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-display font-bold text-lg">{cat.name}</p>
                    <p className="text-white/70 text-xs mt-0.5">Trending now</p>
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
