"use client";

import Link from "next/link";
import VideoFollowPill from "./VideoFollowPill";

interface ContextCreatorInfoProps {
  user: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    heightCm: number | null;
  };
}

export default function ContextCreatorInfo({ user }: ContextCreatorInfoProps) {
  return (
    <div className="retail-panel rounded-xl p-4">
      <p className="retail-kicker mb-3">Featured Creator</p>
      <div className="flex items-center gap-3">
      <Link href={`/@${user.username}`} className="flex-shrink-0">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center ring-1 ring-border">
            <span className="text-base font-bold text-muted">
              {(user.name ?? user.username ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/@${user.username}`}
          className="text-[17px] font-display font-semibold text-text hover:text-accent transition-colors truncate block tracking-[-0.02em]"
        >
          {user.name || `@${user.username}`}
        </Link>
        {user.heightCm != null && (
          <p className="text-[12px] text-muted mt-0.5">Height {user.heightCm} cm</p>
        )}
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted truncate mt-1">@{user.username}</p>
      </div>
      <VideoFollowPill creatorId={user.id} />
      </div>
    </div>
  );
}
