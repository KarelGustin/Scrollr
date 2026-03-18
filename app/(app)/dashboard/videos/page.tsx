"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useVideos } from "@/hooks/useVideos";
import { VideoCard } from "@/components/dashboard/VideoCard";
import { UploadModal } from "@/components/dashboard/UploadModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function VideosPage() {
  const { data: videos, isLoading } = useVideos();
  const [uploadOpen, setUploadOpen] = useState(false);
  const searchParams = useSearchParams();

  // Auto-open upload modal from URL param (mobile bottom nav "+" button)
  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setUploadOpen(true);
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/videos");
    }
  }, [searchParams]);

  return (
    <div className="space-y-6 px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Videos</h1>
          <p className="text-sm text-muted mt-1">
            Manage your uploaded videos and tagged products
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-accent" />
        </div>
      ) : !videos || videos.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto mb-4 text-muted" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <h2 className="text-lg font-display font-semibold text-text mb-1">
            No videos yet
          </h2>
          <p className="text-sm text-muted mb-4">
            Upload your first video to start building your shoppable feed
          </p>
          <Button onClick={() => setUploadOpen(true)}>Create Your First Post</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video: { id: string; thumbnailUrl: string | null; status: string; published: boolean; duration: number | null; createdAt: string; products: { product: { id: string; name: string; brand: string | null; price: number | null; priceDisplay: string | null } }[] }) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
