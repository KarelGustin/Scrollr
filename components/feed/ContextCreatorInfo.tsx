"use client";

import Link from "next/link";
import VideoFollowPill from "./VideoFollowPill";

interface ContextCreatorInfoProps {
  user: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export default function ContextCreatorInfo({ user }: ContextCreatorInfoProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <Link href={`/@${user.username}`} className="flex-shrink-0">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-surface flex items-center justify-center ring-2 ring-border">
            <span className="text-base font-bold text-muted">
              {(user.name ?? user.username ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/@${user.username}`}
          className="text-sm font-semibold text-text hover:text-accent transition-colors truncate block"
        >
          {user.name || `@${user.username}`}
        </Link>
        <p className="text-xs text-muted truncate">@{user.username}</p>
      </div>
      <VideoFollowPill creatorId={user.id} />
    </div>
  );
}
