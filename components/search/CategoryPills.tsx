"use client";

import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

interface CategoryPillsProps {
  categories: Category[];
  activeSlug: string | null;
  floating?: boolean;
}

export default function CategoryPills({ categories, activeSlug, floating = false }: CategoryPillsProps) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {/* "All" pill */}
        <Link
          href="/discover"
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            !activeSlug
              ? "bg-white text-black"
              : floating
                ? "bg-white/15 backdrop-blur-md text-white/80 hover:text-white hover:bg-white/25"
                : "bg-surface border border-border text-muted hover:text-text hover:border-white/20"
          }`}
        >
          All
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/discover?category=${cat.slug}`}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeSlug === cat.slug
                ? "bg-white text-black"
                : floating
                  ? "bg-white/15 backdrop-blur-md text-white/80 hover:text-white hover:bg-white/25"
                  : "bg-surface border border-border text-muted hover:text-text hover:border-white/20"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Fade edge — transparent for floating, bg-based for normal */}
      {!floating && (
        <div className="absolute top-0 right-0 bottom-2 w-8 bg-gradient-to-l from-bg to-transparent pointer-events-none" />
      )}
    </div>
  );
}
