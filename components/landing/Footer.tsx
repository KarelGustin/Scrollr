export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-display font-bold text-text">Scrollr</span>
          <span className="text-xs text-muted">Beta</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-muted">
          <a href="#how-it-works" className="hover:text-text transition-colors">How it works</a>
          <a href="/login" className="hover:text-text transition-colors">Sign in</a>
        </div>
        <p className="text-xs text-muted/50">&copy; 2026 Scrollr. All rights reserved.</p>
      </div>
    </footer>
  );
}
