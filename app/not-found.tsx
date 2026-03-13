import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold text-accent mb-4">404</h1>
        <h2 className="text-xl font-display font-bold text-text mb-2">
          Page not found
        </h2>
        <p className="text-sm text-muted mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/discover"
            className="px-5 py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-lg hover:bg-surface transition-colors"
          >
            Discover
          </Link>
        </div>
      </div>
    </div>
  );
}
