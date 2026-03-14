"use client";

import Link from "next/link";

interface AuthGateOverlayProps {
  onClose?: () => void;
}

export default function AuthGateOverlay({ onClose }: AuthGateOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Glassmorphic card */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
        {/* Optional close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted hover:text-text transition-colors"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Logo / Brand */}
        <h1 className="text-3xl font-display font-bold text-text tracking-tight">
          Scrollr
        </h1>

        {/* Heading */}
        <h2 className="mt-4 text-xl font-display font-semibold text-text">
          Sign up to keep scrolling
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Create a free account to unlock unlimited videos, save your favorites,
          and shop products
        </p>

        {/* CTA buttons */}
        <div className="mt-6 space-y-3">
          <Link
            href="/register"
            className="block w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/5"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
