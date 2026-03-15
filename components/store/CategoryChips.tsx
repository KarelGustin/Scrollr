"use client";

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  isDark: boolean;
}

export function CategoryChips({ categories, selected, onSelect, isDark }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-6 pb-4 scrollbar-hide">
      {["All", ...categories].map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selected === cat
              ? isDark ? "bg-coral text-white" : "bg-[#1a1a1a] text-white"
              : isDark ? "bg-white/10 text-white/60" : "bg-white text-[#666] border border-[#e5e5e5]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
