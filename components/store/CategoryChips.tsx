"use client";

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  isDark: boolean;
}

export function CategoryChips({ categories, selected, onSelect, isDark }: CategoryChipsProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 pb-1 scrollbar-hide">
      {["All", ...categories].map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
            selected === cat
              ? isDark
                ? "bg-white text-[#111] shadow-sm"
                : "bg-[#1a1a1a] text-white shadow-sm"
              : isDark
              ? "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/70"
              : "bg-white text-[#777] border border-[#e5e5e5] hover:border-[#ccc] hover:text-[#444]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
