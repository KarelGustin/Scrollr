"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { MessagePopup } from "@/components/consumer/MessagePopup";

const consumerTabs = [
  {
    label: "Feed",
    href: "/feed",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        {!active && <polyline points="9 22 9 12 15 12 15 22" />}
      </svg>
    ),
  },
  {
    label: "Discover",
    href: "/discover",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const creatorTabs = [
  {
    label: "Feed",
    href: "/feed",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        {!active && <polyline points="9 22 9 12 15 12 15 22" />}
      </svg>
    ),
  },
  {
    label: "Discover",
    href: "/discover",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: "",
    href: "/dashboard/videos?upload=true",
    icon: () => (
      <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center -mt-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
];

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
  const { user, status } = useAuth();
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
  const tabs = isCreator ? creatorTabs : consumerTabs;

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
          </div>
        </div>
      </header>

      <main className="pb-[68px] md:pb-0">{children}</main>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-[52px]">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 transition-colors ${
                  active ? "text-text" : "text-muted"
                }`}
              >
                {tab.icon(active)}
                {tab.label && (
                  <span className="text-[10px] font-medium">{tab.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
