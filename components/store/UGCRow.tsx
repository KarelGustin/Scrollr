"use client";
import Link from "next/link";

interface UGCVideo {
  id: string;
  thumbnailUrl: string | null;
  user: { username: string } | null;
  score: { totalViews: number } | null;
}

interface UGCRowProps {
  videos: UGCVideo[];
  isDark: boolean;
}

export function UGCRow({ videos, isDark }: UGCRowProps) {
  if (videos.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-white/40" : "text-[#1a1a1a]"}`}>
        See it in action
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {videos.map((video) => (
          <Link key={video.id} href={`/feed?v=${video.id}`} className="min-w-[100px] flex-shrink-0">
            <div className={`aspect-[9/16] rounded-xl overflow-hidden relative ${isDark ? "bg-white/5" : "bg-[#f0eeeb]"}`}>
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg opacity-30">&#9654;</div>
              )}
              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                <p className={`text-[10px] font-semibold ${isDark ? "text-white/80" : "text-[#666]"}`}>
                  @{video.user?.username || "unknown"}
                </p>
                <p className={`text-[9px] ${isDark ? "text-white/40" : "text-[#999]"}`}>
                  {video.score?.totalViews?.toLocaleString() || 0} views
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
