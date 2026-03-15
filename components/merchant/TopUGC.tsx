"use client";

import { useEffect, useState } from "react";

interface UGCVideo {
  id: string;
  thumbnailUrl: string | null;
  creatorName: string;
  views: number;
}

export function TopUGC({ merchantId }: { merchantId: string }) {
  const [videos, setVideos] = useState<UGCVideo[]>([]);

  useEffect(() => {
    // Will be populated when creators make content for this merchant
  }, [merchantId]);

  return (
    <div className="bg-white border border-[#f0f0f0] rounded-xl p-5">
      <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">Top Performing UGC</h3>
      {videos.length === 0 ? (
        <p className="text-sm text-[#999] py-6 text-center">Creator content will appear here as creators tag your products</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {videos.map((video) => (
            <div key={video.id} className="shrink-0 w-32">
              <div className="aspect-[9/16] rounded-lg bg-[#f5f3f0] overflow-hidden mb-2">
                {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <p className="text-xs font-medium text-[#1a1a1a] truncate">{video.creatorName}</p>
              <p className="text-[10px] text-[#999]">{video.views} views</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
