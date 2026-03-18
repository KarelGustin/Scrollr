"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useState, useEffect, useLayoutEffect, useMemo } from "react";

interface AppSession {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  heightCm?: number | null;
  role: string;
}

interface Tab {
  label: string;
  href: string;
  requiresAuth?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

/* ─── Icons ─── */

const HomeIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    {!active && <polyline points="9 22 9 12 15 12 15 22" />}
  </svg>
);

const DiscoverIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const OrdersIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CartIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const ProfileIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const DashboardIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const UploadIcon = () => (
  <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center -mt-2">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </div>
);

/* ─── Tab configs ─── */

const unauthenticatedTabs: Tab[] = [
  { label: "Home", href: "/discover", icon: HomeIcon },
  { label: "Cart", href: "/checkout", icon: CartIcon },
  { label: "Orders", href: "/orders", icon: OrdersIcon },
  { label: "Profile", href: "/login", icon: ProfileIcon },
];

const consumerTabs: Tab[] = [
  { label: "Feed", href: "/feed", icon: HomeIcon },
  { label: "Discover", href: "/discover", icon: DiscoverIcon },
  { label: "Cart", href: "/checkout", icon: CartIcon },
  { label: "Orders", href: "/orders", icon: OrdersIcon },
  { label: "Profile", href: "/profile", icon: ProfileIcon },
];

const creatorTabs: Tab[] = [
  { label: "Feed", href: "/feed", icon: HomeIcon },
  { label: "Discover", href: "/discover", icon: DiscoverIcon },
  { label: "", href: "/create", icon: UploadIcon },
  { label: "Orders", href: "/orders", icon: OrdersIcon },
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
];

function getTabsForUser(user: AppSession | null): Tab[] {
  if (!user) return unauthenticatedTabs;
  switch (user.role) {
    case "CREATOR":
    case "ADMIN":
    case "MERCHANT":
      return consumerTabs;
    default:
      return consumerTabs;
  }
}

function isActiveTab(href: string, pathname: string): boolean {
  if (href === "/feed") return pathname === "/feed";
  if (href === "/discover") return pathname === "/discover" || pathname.startsWith("/discover/");
  if (href === "/dashboard") return pathname === "/dashboard" && !pathname.startsWith("/dashboard/");
  if (href === "/profile") return pathname.startsWith("/profile");
  if (href === "/merchant") return pathname.startsWith("/merchant");
  return pathname.startsWith(href);
}

/* ─── Component ─── */

interface BottomNavProps {
  user: AppSession | null;
  pathname?: string; // kept for compat, but we read from usePathname()
}

export function BottomNav({ user }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = useMemo(() => getTabsForUser(user), [user]);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const activeIndex = tabs.findIndex((t) => isActiveTab(t.href, pathname));

  // Reset refs array when tabs change (e.g. after login)
  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  // Measure the active tab and position the sliding indicator
  const syncIndicator = () => {
    const nav = navRef.current;
    const activeEl = tabRefs.current[activeIndex];
    if (!nav || !activeEl) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();
    setIndicator({ left: tabRect.left - navRect.left, width: tabRect.width });
  };

  useLayoutEffect(syncIndicator, [activeIndex, tabs]);

  useEffect(() => {
    window.addEventListener("resize", syncIndicator);
    return () => window.removeEventListener("resize", syncIndicator);
  }, [activeIndex, tabs]);

  const handleTabClick = (e: React.MouseEvent, tab: Tab) => {
    if (tab.requiresAuth && !user) {
      e.preventDefault();
      router.push(`/login?callbackUrl=${encodeURIComponent(tab.href)}`);
    }
  };

  const isVideoPage = pathname === "/feed" || pathname === "/discover" || pathname.startsWith("/discover?");

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
    >
      <nav
        ref={navRef}
        className={`relative pointer-events-auto mx-4 mb-1 rounded-[22px] overflow-hidden transition-colors ${
          isVideoPage
            ? "bg-black/30 border border-white/[0.08]"
            : "bg-bg/70 border border-border/60"
        }`}
        style={{
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
        }}
      >
        {/* Sliding active indicator */}
        {activeIndex >= 0 && indicator.width > 0 && (
          <div
            className={`absolute top-[5px] bottom-[5px] rounded-[17px] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
              isVideoPage
                ? "bg-white/[0.12]"
                : "bg-text/[0.07]"
            }`}
            style={{
              left: indicator.left,
              width: indicator.width,
            }}
          />
        )}

        <div className="relative flex items-center px-1.5">
          {tabs.map((tab, i) => {
            const active = isActiveTab(tab.href, pathname);
            return (
              <Link
                key={tab.href + tab.label}
                ref={(el) => { tabRefs.current[i] = el; }}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab)}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 transition-all duration-200 ${
                  isVideoPage
                    ? active ? "text-white" : "text-white/40"
                    : active ? "text-text" : "text-muted/60"
                }`}
              >
                <span className={`transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}>
                  {tab.icon(active)}
                </span>
                {tab.label && (
                  <span className={`text-[9px] font-semibold uppercase tracking-[0.06em] transition-opacity duration-200 ${
                    active ? "opacity-100" : "opacity-60"
                  }`}>
                    {tab.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
