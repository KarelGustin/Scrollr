"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SavedItemsSkeleton } from "@/components/ui/Skeleton";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"saved" | "orders">("saved");

  const { data: follows } = useQuery<{ id: string }[]>({
    queryKey: ["following-list"],
    queryFn: async () => {
      const res = await fetch("/api/follows");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: savedItems, isLoading: savedLoading } = useQuery({
    queryKey: ["saved-items"],
    queryFn: async () => {
      const res = await fetch("/api/saved");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: application } = useQuery({
    queryKey: ["creator-application"],
    queryFn: async () => {
      const res = await fetch("/api/creator-application");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: user?.role === "USER",
  });

  if (!user) return null;

  const isCreator = user.role === "CREATOR" || user.role === "ADMIN";
  const followingCount = follows?.length ?? 0;
  const savedCount = savedItems?.length ?? 0;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="text-lg font-display font-bold text-text">
            @{user.username}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="p-2 text-muted hover:text-text transition-colors"
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-5">
          <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted">
                {(user.name ?? user.username ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-display font-bold text-text">
              {user.name || user.username}
            </h2>
            {user.bio && (
              <p className="text-sm text-muted mt-0.5 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mb-5 pb-5 border-b border-border">
          <div className="text-center">
            <p className="text-base font-bold text-text">{followingCount}</p>
            <p className="text-xs text-muted">Following</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-text">{savedCount}</p>
            <p className="text-xs text-muted">Saved</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <Link
            href="/profile/edit"
            className="flex-1 py-2 text-center text-sm font-semibold text-text bg-surface border border-border rounded-xl hover:bg-card transition-colors"
          >
            Edit Profile
          </Link>
          {isCreator ? (
            <Link
              href="/dashboard"
              className="flex-1 py-2 text-center text-sm font-semibold text-accent-fg bg-accent rounded-xl hover:bg-accent/90 transition-colors"
            >
              Creator Dashboard
            </Link>
          ) : application?.status === "PENDING" ? (
            <div className="flex-1 py-2 text-center text-sm font-semibold text-warning bg-warning/10 rounded-xl">
              Application Pending
            </div>
          ) : (
            <Link
              href="/apply"
              className="flex-1 py-2 text-center text-sm font-semibold text-accent-fg bg-accent rounded-xl hover:bg-accent/90 transition-colors"
            >
              Become a Creator
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === "saved"
                ? "border-text text-text"
                : "border-transparent text-muted"
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === "orders"
                ? "border-text text-text"
                : "border-transparent text-muted"
            }`}
          >
            Activity
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "saved" && (
          <div>
            {savedLoading ? (
              <SavedItemsSkeleton />
            ) : !savedItems?.length ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted">No saved items yet</p>
                <p className="text-xs text-muted mt-1">Bookmark videos and products to find them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {savedItems.map((item: { id: string; video?: { id: string; thumbnailUrl: string | null }; product?: { id: string; imageUrl: string | null; name: string } }) => {
                  const thumb = item.video?.thumbnailUrl || item.product?.imageUrl;
                  return (
                    <div key={item.id} className="aspect-[3/4] bg-surface rounded-lg overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                          {item.product?.name?.slice(0, 12) || "Saved"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="text-center py-12">
            <p className="text-sm text-muted">View your full order history in the</p>
            <Link href="/orders" className="text-sm text-accent font-medium">
              Orders tab
            </Link>
          </div>
        )}

        {/* Settings section */}
        <div className="mt-8 pt-6 border-t border-border space-y-1">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm text-destructive hover:bg-surface rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
