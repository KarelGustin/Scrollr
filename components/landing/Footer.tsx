import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] py-12 bg-white">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-display font-bold text-[#0a0a0a]">Scroller</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="text-sm text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
            Join as a Creator
          </Link>
        </div>

        <p className="text-xs text-[#9ca3af]">
          &copy; {new Date().getFullYear()} Scroller
        </p>
      </div>
    </footer>
  );
}
