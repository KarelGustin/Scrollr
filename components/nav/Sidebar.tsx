"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

interface NavLink {
  href: string;
  label: string;
  icon: ReactNode;
}

const FeedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const DiscoverIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const OrdersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const VideosIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const consumerLinks: NavLink[] = [
  { href: "/feed", label: "Feed", icon: <FeedIcon /> },
  { href: "/discover", label: "Discover", icon: <DiscoverIcon /> },
  { href: "/orders", label: "Orders", icon: <OrdersIcon /> },
  { href: "/checkout", label: "Cart", icon: <CartIcon /> },
];

const creatorLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/dashboard/videos", label: "My Videos", icon: <VideosIcon /> },
  { href: "/dashboard/settings", label: "Settings", icon: <SettingsIcon /> },
];

const guestLinks: NavLink[] = [
  { href: "/discover", label: "Feed", icon: <FeedIcon /> },
  { href: "/search", label: "Discover", icon: <DiscoverIcon /> },
  { href: "/orders", label: "Orders", icon: <OrdersIcon /> },
  { href: "/checkout", label: "Cart", icon: <CartIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isCreator = user?.role === "CREATOR" || user?.role === "ADMIN";
  const profileLabel = user?.name || user?.username || "Profile";
  const profileSubLabel = user?.username ? `@${user.username}` : user?.email ?? null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/feed" && pathname.startsWith(href));

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const themeIcon = theme === "dark" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ) : theme === "light" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[224px] bg-card/95 border-r border-border flex-col z-40 transition-all backdrop-blur-sm">
      <div className="px-6 pt-7 pb-6">
        <p className="retail-kicker mb-2">Shoppable Feed</p>
        <Link href={user ? "/feed" : "/discover"} className="text-[1.85rem] leading-none font-editorial font-semibold text-text">
          Scrollr
        </Link>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-1">
        {(user ? consumerLinks : guestLinks).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={`flex items-center gap-3 px-3 py-3 rounded-md text-[0.8rem] uppercase tracking-[0.16em] transition-colors ${
              isActive(link.href)
                ? "bg-text text-accent-fg"
                : "text-muted hover:text-text hover:bg-surface/75"
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center ${isActive(link.href) ? "text-accent-fg" : ""}`}>
              {link.icon}
            </span>
            <span>{link.label}</span>
          </Link>
        ))}

        {/* Creator nav hidden — merchant-first pivot */}
        {false && isCreator && (
          <>
            <div className="h-px bg-border my-2" />
            <p className="text-[10px] text-muted uppercase tracking-wider px-2 mb-1">Creator</p>
            {creatorLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive(link.href)
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-muted hover:text-text hover:bg-surface"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center ${isActive(link.href) ? "text-accent" : ""}`}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-4 pb-5 space-y-3">
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
          className="flex items-center gap-2 w-full px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-muted hover:text-text rounded-md hover:bg-surface transition-all border border-border/80"
        >
          {themeIcon}
          <span className="capitalize">{theme}</span>
        </button>

        {user ? (
          <div className="border-t border-border pt-4">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-surface transition-colors retail-panel"
            >
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-text border border-border">
                {profileLabel.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text truncate">{profileLabel}</p>
                {profileSubLabel && (
                  <p className="text-[10px] text-muted truncate">{profileSubLabel}</p>
                )}
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="flex items-center justify-center gap-2 w-full px-3 py-3 text-[0.74rem] uppercase tracking-[0.16em] text-destructive hover:bg-destructive/10 rounded-md transition-all mt-2 border border-destructive/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-border pt-4 space-y-2">
            <Link
              href="/login"
              className="flex items-center justify-center w-full px-3 py-3 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-text rounded-md border border-border hover:bg-surface transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center w-full px-3 py-3 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-accent-fg bg-accent rounded-md hover:bg-accent/90 transition-colors"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
