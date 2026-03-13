"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-black/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-[#0a0a0a]">Scroller</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
            How it works
          </a>
          <Link href="/login" className="text-sm text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-5 py-2.5 bg-[#0a0a0a] text-white rounded-full hover:bg-[#1a1a1a] transition-all duration-200"
          >
            Join as a Creator
          </Link>
        </div>

        {/* Mobile */}
        <Link
          href="/register"
          className="sm:hidden text-sm font-medium px-4 py-2 bg-[#0a0a0a] text-white rounded-full"
        >
          Join as a Creator
        </Link>
      </div>
    </nav>
  );
}
