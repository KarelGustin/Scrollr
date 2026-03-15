"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { MessagePopup } from "@/components/consumer/MessagePopup";
import { BottomNav } from "@/components/nav/BottomNav";

const desktopNavLinks = [
  { label: "Feed", href: "/feed" },
  { label: "Discover", href: "/discover" },
  { label: "Orders", href: "/orders" },
];

const desktopCreatorLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Videos", href: "/dashboard/videos" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, status, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    if (status === "authenticated" && user && !user.username) {
      router.replace("/onboarding");
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!user) return null;

  const isCreator = user.role === "CREATOR" || user.role === "ADMIN";

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed";
    if (href === "/discover") return pathname === "/discover" || pathname.startsWith("/discover");
    if (href === "/dashboard") return pathname === "/dashboard" && !pathname.startsWith("/dashboard/");
    if (href === "/profile") return pathname.startsWith("/profile");
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-bg">
      <MessagePopup />

      {/* Desktop top bar */}
      <header className="hidden md:block sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/feed" className="text-lg font-display font-bold text-text">
              Scrollr
            </Link>
            <nav className="flex items-center gap-6">
              {desktopNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href) ? "text-text" : "text-muted hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isCreator &&
                desktopCreatorLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive(link.href) ? "text-text" : "text-muted hover:text-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isCreator && (
              <Link
                href="/dashboard/videos?upload=true"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-accent text-accent-fg text-sm font-semibold rounded-full hover:bg-accent/90 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Upload
              </Link>
            )}
            <Link
              href={isCreator ? "/dashboard" : "/profile"}
              className={`text-sm font-medium transition-colors ${
                isActive("/profile") || isActive("/dashboard") ? "text-text" : "text-muted hover:text-text"
              }`}
            >
              {isCreator ? "Dashboard" : "Profile"}
            </Link>
            <button
              onClick={async () => { await signOut(); router.replace("/"); }}
              className="text-sm font-medium text-muted hover:text-destructive transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="pb-[76px] md:pb-0">{children}</main>

      <BottomNav user={user} pathname={pathname} />
    </div>
  );
}
