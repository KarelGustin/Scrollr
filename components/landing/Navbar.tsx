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
          ? "bg-bg/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-text">Scrollr</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted hover:text-text transition-colors">
            How it works
          </a>
          <Link href="/login" className="text-sm text-muted hover:text-text transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-5 py-2 bg-accent text-accent-fg rounded-xl hover:bg-accent/90 transition-all duration-200 hover:shadow-[0_0_20px_rgba(200,255,0,0.2)]"
          >
            Get started
          </Link>
        </div>

        {/* Mobile */}
        <Link
          href="/register"
          className="sm:hidden text-sm font-medium px-4 py-2 bg-accent text-accent-fg rounded-xl"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
