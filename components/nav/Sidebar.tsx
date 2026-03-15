"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const isCreator = user?.role === "CREATOR" || user?.role === "ADMIN";

  const isActive = (href: string) =>
    pathname === href || (href !== "/feed" && pathname.startsWith(href));

  if (!user) return null;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[200px] bg-white border-r border-[#f0f0f0] flex-col z-40">
      <div className="px-5 pt-5 pb-6">
        <Link href="/feed" className="text-lg font-bold text-[#1a1a1a]">Scrollr</Link>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {consumerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(link.href) ? "bg-[#f5f3f0] font-semibold text-[#1a1a1a]" : "text-[#888] hover:text-[#1a1a1a] hover:bg-[#faf9f7]"
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center">{link.icon}</span>
            {link.label}
          </Link>
        ))}

        {isCreator && (
          <>
            <div className="h-px bg-[#f0f0f0] my-2" />
            <p className="text-[10px] text-[#bbb] uppercase tracking-wider px-2 mb-1">Creator</p>
            {creatorLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(link.href) ? "bg-[#f5f3f0] font-semibold text-[#1a1a1a]" : "text-[#888] hover:text-[#1a1a1a] hover:bg-[#faf9f7]"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 pb-4 border-t border-[#f0f0f0] pt-3">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#faf9f7] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#e8e5e0] flex items-center justify-center text-xs font-bold text-[#1a1a1a]">
            {(user.name || user.username || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1a1a1a] truncate">{user.name || user.username}</p>
            <p className="text-[10px] text-[#aaa] truncate">@{user.username}</p>
          </div>
        </Link>
        <button
          onClick={signOut}
          className="w-full text-left px-2 py-2 text-xs text-[#999] hover:text-red-500 transition-colors mt-1"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
