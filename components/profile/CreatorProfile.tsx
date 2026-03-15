"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { FeedVideo, FeedVideoProduct } from "@/types";
import FollowButton from "./FollowButton";
import CreatorReelsViewer from "./CreatorReelsViewer";

interface ProfileVideo {
  id: string;
  thumbnailUrl: string | null;
  hlsUrl: string;
  duration: number | null;
  viewCount: number;
  products: FeedVideoProduct[];
}

interface CreatorData {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  videos: ProfileVideo[];
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

export default function CreatorProfile({ creator }: { creator: CreatorData }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const feedVideos = useMemo<FeedVideo[]>(
    () =>
      creator.videos.map((video) => ({
        id: video.id,
        hlsUrl: video.hlsUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        user: {
          id: creator.id,
          username: creator.username,
          name: creator.name,
          avatarUrl: creator.avatarUrl,
        },
        products: video.products,
      })),
    [creator]
  );

  const handleVideoClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
          <Link href="/discover" className="p-1 text-muted hover:text-text transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-sm font-semibold text-text">@{creator.username}</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Profile header */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-surface mb-3">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-muted">
                  {(creator.name || creator.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="text-lg font-bold text-text">
            {creator.name || `@${creator.username}`}
          </h2>

          {/* Stats row */}
          <div className="flex items-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-text">{formatCount(creator.followingCount)}</p>
              <p className="text-xs text-muted">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text">{formatCount(creator.followersCount)}</p>
              <p className="text-xs text-muted">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text">{formatCount(creator.videos.reduce((sum, v) => sum + v.viewCount, 0))}</p>
              <p className="text-xs text-muted">Views</p>
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="text-sm text-text text-center mt-3 max-w-sm leading-relaxed">
              {creator.bio}
            </p>
          )}

          {/* Follow button */}
          <div className="mt-4 w-full max-w-xs">
            <FollowButton creatorId={creator.id} />
          </div>
        </div>
      </div>

      {/* Divider with icon tabs (like TikTok) */}
      <div className="border-b border-border max-w-lg mx-auto">
        <div className="flex items-center justify-center">
          <button className="flex-1 flex items-center justify-center py-3 border-b-2 border-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Video grid */}
      <div className="max-w-lg mx-auto">
        {creator.videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <p className="text-sm text-muted">No videos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px bg-border">
            {creator.videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => handleVideoClick(index)}
                className="relative aspect-[9/16] bg-surface overflow-hidden group"
                aria-label={`Open video ${index + 1}`}
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

                {/* View count overlay */}
                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs drop-shadow-md">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{formatCount(video.viewCount)}</span>
                </div>

                {/* Duration */}
                {video.duration && (
                  <div className="absolute bottom-1 right-1 text-white text-xs drop-shadow-md">
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* Products badge */}
                {video.products.length > 0 && (
                  <div className="absolute top-1 right-1 bg-accent/90 text-accent-fg text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="inline mr-0.5">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                    {video.products.length}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video player modal */}
      {activeIndex !== null && (
        <CreatorReelsViewer
          videos={feedVideos}
          creatorUsername={creator.username}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </div>
  );
}
