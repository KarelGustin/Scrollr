import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
            <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0122.56 9" />
            <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
            <path d="M8.53 16.11a6 6 0 016.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1 className="text-xl font-display font-bold text-text mb-2">
          You&apos;re offline
        </h1>
        <p className="text-sm text-muted mb-6">
          Check your internet connection and try again.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
        >
          Retry
        </Link>
      </div>
    </div>
  );
}
