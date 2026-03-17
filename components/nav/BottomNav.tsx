"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface AppSession {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
}

interface Tab {
  label: string;
  href: string;
  requiresAuth?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

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

const StoreIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-4h16l1 4" />
    <path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9" />
    <path d="M9 21V13h6v8" />
  </svg>
);

const unauthenticatedTabs: Tab[] = [
  { label: "Feed", href: "/discover", icon: HomeIcon },
  { label: "Discover", href: "/discover", icon: DiscoverIcon },
  { label: "Orders", href: "/orders", requiresAuth: true, icon: OrdersIcon },
  { label: "Profile", href: "/profile", requiresAuth: true, icon: ProfileIcon },
];

const consumerTabs: Tab[] = [
  { label: "Feed", href: "/feed", icon: HomeIcon },
  { label: "Discover", href: "/discover", icon: DiscoverIcon },
  { label: "Orders", href: "/orders", icon: OrdersIcon },
  { label: "Profile", href: "/profile", icon: ProfileIcon },
];

const creatorTabs: Tab[] = [
  { label: "Feed", href: "/feed", icon: HomeIcon },
  { label: "Discover", href: "/discover", icon: DiscoverIcon },
  { label: "", href: "/dashboard/videos?upload=true", icon: UploadIcon },
  { label: "Orders", href: "/orders", icon: OrdersIcon },
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
];

const merchantTabs: Tab[] = [
  { label: "Feed", href: "/feed", icon: HomeIcon },
  { label: "Discover", href: "/discover", icon: DiscoverIcon },
  { label: "Orders", href: "/orders", icon: OrdersIcon },
  { label: "My Store", href: "/merchant", icon: StoreIcon },
];

function getTabsForUser(user: AppSession | null): Tab[] {
  if (!user) return unauthenticatedTabs;
  switch (user.role) {
    case "MERCHANT":
      return merchantTabs;
    case "CREATOR":
    case "ADMIN":
      return consumerTabs;
    default:
      return consumerTabs;
  }
}

function isActive(href: string, pathname: string): boolean {
  if (href === "/feed") return pathname === "/feed";
  if (href === "/discover") return pathname === "/discover" || pathname.startsWith("/discover/");
  if (href === "/dashboard") return pathname === "/dashboard" && !pathname.startsWith("/dashboard/");
  if (href === "/profile") return pathname.startsWith("/profile");
  if (href === "/merchant") return pathname.startsWith("/merchant");
  return pathname.startsWith(href);
}

interface BottomNavProps {
  user: AppSession | null;
  pathname: string;
}

export function BottomNav({ user, pathname }: BottomNavProps) {
  const router = useRouter();
  const tabs = getTabsForUser(user);

  const handleTabClick = (e: React.MouseEvent, tab: Tab) => {
    if (tab.requiresAuth && !user) {
      e.preventDefault();
      router.push(`/login?callbackUrl=${encodeURIComponent(tab.href)}`);
    }
  };

  // Use transparent glass style on video pages (feed/discover)
  const isVideoPage = pathname === "/feed" || pathname === "/discover" || pathname.startsWith("/discover?");

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom transition-colors ${
      isVideoPage
        ? "bg-black/40 backdrop-blur-xl border-t border-white/10"
        : "bg-bg/80 backdrop-blur-xl border-t border-border"
    }`}>
      <div className="flex items-center justify-around max-w-lg mx-auto h-[52px]">
        {tabs.map((tab) => {
          const active = isActive(tab.href, pathname);
          return (
            <Link
              key={tab.href + tab.label}
              href={tab.href}
              onClick={(e) => handleTabClick(e, tab)}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 transition-colors ${
                isVideoPage
                  ? active ? "text-white" : "text-white/50"
                  : active ? "text-text" : "text-muted"
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
  );
}
