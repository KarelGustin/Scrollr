import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl sm:text-7xl font-display font-bold text-text">
          Scrollr
        </h1>
        <p className="text-xl text-muted max-w-md mx-auto">
          Your shoppable video feed
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-3 bg-accent text-accent-fg font-medium text-base rounded-[var(--radius)] hover:bg-accent/90 transition-all duration-200"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
