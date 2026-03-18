"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SavedItemsSkeleton } from "@/components/ui/Skeleton";
import CreatorReelsViewer from "@/components/profile/CreatorReelsViewer";
import type { FeedVideo } from "@/types";

interface ProfileVideo {
  id: string;
  thumbnailUrl: string | null;
  hlsUrl: string | null;
  duration: number | null;
  status: string;
  published: boolean;
  createdAt: string;
  _count?: { events: number };
  products?: { id: string; product?: { id: string; name: string; brand: string | null; price: number | null; priceDisplay: string | null; imageUrl: string | null; affiliateUrl: string; description: string | null; sizes: string[] | null; published: boolean } | null; merchantProduct?: { id: string; title: string; description: string | null; imageUrl: string | null; price: number; compareAtPrice: number | null; vendor: string | null; productUrl: string | null; inventoryQuantity: number | null; available: boolean } | null; creatorTaggedSize: string | null }[];
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"videos" | "saved">("videos");
  const [reelIndex, setReelIndex] = useState<number | null>(null);

  const isCreator = user?.role === "CREATOR" || user?.role === "ADMIN";

  const { data: follows } = useQuery<{ id: string }[]>({
    queryKey: ["following-list"],
    queryFn: async () => {
      const res = await fetch("/api/follows");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: followers } = useQuery<{ count: number }>({
    queryKey: ["followers-count"],
    queryFn: async () => {
      const res = await fetch("/api/user/followers-count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: isCreator,
  });

  const { data: myVideos, isLoading: videosLoading } = useQuery<ProfileVideo[]>({
    queryKey: ["my-videos"],
    queryFn: async () => {
      const res = await fetch("/api/videos");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isCreator,
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

  // Convert profile videos to FeedVideo format for the reel viewer
  const feedVideos = useMemo<FeedVideo[]>(() => {
    if (!myVideos || !user) return [];
    return myVideos
      .filter((v) => v.status === "READY" && v.published && v.hlsUrl)
      .map((v) => ({
        id: v.id,
        hlsUrl: v.hlsUrl!,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration,
        user: {
          id: user.id,
          username: user.username ?? "",
          name: user.name,
          avatarUrl: user.avatarUrl,
          heightCm: user.heightCm ?? null,
        },
        products: (v.products ?? [])
          .filter((vp) => vp.product ? vp.product.published : vp.merchantProduct?.available)
          .map((vp) => {
            const mp = vp.merchantProduct;
            const p = vp.product;
            return {
              id: p?.id ?? mp?.id ?? vp.id,
              name: mp?.title ?? p?.name ?? "Unknown",
              brand: p?.brand ?? null,
              price: mp?.price ?? p?.price ?? null,
              priceDisplay: mp ? `$${mp.price.toFixed(2)}` : p?.priceDisplay ?? null,
              imageUrl: mp?.imageUrl ?? p?.imageUrl ?? null,
              affiliateUrl: p?.affiliateUrl ?? mp?.productUrl ?? "",
              description: mp?.description ?? p?.description ?? null,
              sizes: p?.sizes ?? null,
              merchantProductId: mp?.id ?? null,
              merchantUrl: mp?.productUrl ?? null,
              vendor: mp?.vendor ?? null,
              inventoryQuantity: mp?.inventoryQuantity ?? null,
              compareAtPrice: mp?.compareAtPrice ?? null,
              images: null,
              variants: null,
              creatorTaggedSize: vp.creatorTaggedSize ?? null,
              creatorHeightCm: user.heightCm ?? null,
            };
          }),
      }));
  }, [myVideos, user]);

  const publishedVideos = useMemo(
    () => (myVideos ?? []).filter((v) => v.status === "READY" && v.published),
    [myVideos]
  );

  const handleVideoClick = useCallback((index: number) => {
    setReelIndex(index);
  }, []);

  if (!user) return null;

  const followingCount = follows?.length ?? 0;
  const followersCount = followers?.count ?? 0;
  const savedCount = savedItems?.length ?? 0;
  const totalViews = publishedVideos.reduce((sum, v) => sum + (v._count?.events ?? 0), 0);

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
        <div className="flex items-center justify-between px-5 py-3 max-w-lg mx-auto">
          <h1 className="text-lg font-display font-bold text-text">
            @{user.username}
          </h1>
          <div className="flex items-center gap-1">
            {isCreator && (
              <Link
                href="/create"
                className="p-2 text-muted hover:text-text transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Link>
            )}
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
        {/* Profile header — Instagram style */}
        <div className="flex items-center gap-5 mb-4">
          <div className="w-20 h-20 rounded-full bg-surface border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted">
                {(user.name ?? user.username ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Stats — Instagram layout: row of stats next to avatar */}
          {isCreator ? (
            <div className="flex-1 flex items-center justify-around">
              <div className="text-center">
                <p className="text-lg font-bold text-text">{publishedVideos.length}</p>
                <p className="text-xs text-muted">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text">{formatCount(followersCount)}</p>
                <p className="text-xs text-muted">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text">{formatCount(followingCount)}</p>
                <p className="text-xs text-muted">Following</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-8">
              <div className="text-center">
                <p className="text-lg font-bold text-text">{followingCount}</p>
                <p className="text-xs text-muted">Following</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text">{savedCount}</p>
                <p className="text-xs text-muted">Saved</p>
              </div>
            </div>
          )}
        </div>

        {/* Name & bio */}
        <div className="mb-4">
          <h2 className="text-sm font-bold text-text">
            {user.name || user.username}
          </h2>
          {user.bio && (
            <p className="text-sm text-muted mt-0.5 leading-relaxed">{user.bio}</p>
          )}
          {isCreator && (
            <p className="text-xs text-accent mt-1">
              scrollr.co/@{user.username}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-5">
          <Link
            href="/profile/edit"
            className="flex-1 py-2 text-center text-sm font-semibold text-text bg-surface border border-border rounded-lg hover:bg-card transition-colors"
          >
            Edit Profile
          </Link>
          {isCreator ? (
            <Link
              href="/dashboard"
              className="flex-1 py-2 text-center text-sm font-semibold text-text bg-surface border border-border rounded-lg hover:bg-card transition-colors"
            >
              Dashboard
            </Link>
          ) : application?.status === "PENDING" ? (
            <div className="flex-1 py-2 text-center text-sm font-semibold text-warning bg-warning/10 rounded-lg">
              Application Pending
            </div>
          ) : (
            <Link
              href="/apply"
              className="flex-1 py-2 text-center text-sm font-semibold text-accent-fg bg-accent rounded-lg hover:bg-accent/90 transition-colors"
            >
              Become a Creator
            </Link>
          )}
        </div>

        {/* Tabs — Instagram style icons */}
        {isCreator ? (
          <div className="flex border-b border-border mb-0">
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${
                activeTab === "videos"
                  ? "border-text text-text"
                  : "border-transparent text-muted"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${
                activeTab === "saved"
                  ? "border-text text-text"
                  : "border-transparent text-muted"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </button>
          </div>
        ) : (
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
          </div>
        )}

        {/* Video grid — TikTok/Instagram style */}
        {activeTab === "videos" && isCreator && (
          <div>
            {videosLoading ? (
              <div className="grid grid-cols-3 gap-px">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="aspect-[9/16] bg-surface animate-pulse" />
                ))}
              </div>
            ) : publishedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text mb-1">No videos yet</p>
                <p className="text-xs text-muted mb-4">Share your first video with the world</p>
                <Link
                  href="/create"
                  className="px-6 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Create Post
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px bg-border">
                {publishedVideos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => handleVideoClick(index)}
                    className="relative aspect-[9/16] bg-surface overflow-hidden group"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}

                    {/* View count */}
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs drop-shadow-md">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>{formatCount(video._count?.events ?? 0)}</span>
                    </div>

                    {/* Duration */}
                    {video.duration && (
                      <div className="absolute bottom-1 right-1 text-white text-xs drop-shadow-md">
                        {formatDuration(video.duration)}
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved tab */}
        {activeTab === "saved" && (
          <div className={isCreator ? "pt-4" : ""}>
            {savedLoading ? (
              <SavedItemsSkeleton />
            ) : !savedItems?.length ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted">No saved items yet</p>
                <p className="text-xs text-muted mt-1">Bookmark videos and products to find them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px bg-border">
                {savedItems.map((item: { id: string; video?: { id: string; thumbnailUrl: string | null }; product?: { id: string; imageUrl: string | null; name: string } }) => {
                  const thumb = item.video?.thumbnailUrl || item.product?.imageUrl;
                  return (
                    <div key={item.id} className="aspect-[9/16] bg-surface overflow-hidden">
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

        {/* Sign out */}
        <div className="mt-8 pt-6 border-t border-border space-y-1">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm text-destructive hover:bg-surface rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Reel viewer modal */}
      {reelIndex !== null && feedVideos.length > 0 && (
        <CreatorReelsViewer
          videos={feedVideos}
          creatorUsername={user.username ?? ""}
          creatorId={user.id}
          initialIndex={reelIndex}
          onClose={() => setReelIndex(null)}
        />
      )}
    </div>
  );
}
