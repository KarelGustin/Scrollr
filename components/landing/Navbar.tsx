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
          ? "bg-[#FAFAF8]/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-warm-text">Scrollr</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm text-warm-secondary hover:text-warm-text transition-colors"
          >
            How it works
          </a>
          <a
            href="#for-creators"
            className="text-sm text-warm-secondary hover:text-warm-text transition-colors"
          >
            For Creators
          </a>
          <a
            href="#for-merchants"
            className="text-sm text-warm-secondary hover:text-warm-text transition-colors"
          >
            For Merchants
          </a>
          <Link
            href="/login"
            className="text-sm text-warm-secondary hover:text-warm-text transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-5 py-2.5 bg-coral text-white rounded-full hover:bg-coral-hover transition-all duration-200"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile */}
        <Link
          href="/register"
          className="sm:hidden text-sm font-semibold px-4 py-2 bg-coral text-white rounded-full"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
