"use client";

import { useUpdateVideo, useDeleteVideo } from "@/hooks/useVideos";
import { Button } from "@/components/ui/Button";

interface VideoCardProps {
  video: {
    id: string;
    thumbnailUrl: string | null;
    status: string;
    published: boolean;
    duration: number | null;
    createdAt: string;
    products: {
      product: {
        id: string;
        name: string;
        brand: string | null;
        price: number | null;
        priceDisplay: string | null;
      };
    }[];
  };
}

export function VideoCard({ video }: VideoCardProps) {
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();

  const isReady = video.status === "READY";
  const productCount = video.products?.length ?? 0;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] max-h-48 bg-surface">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="text-muted" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isReady
              ? video.published
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
              : video.status === "ERROR" || video.status === "REJECTED"
                ? "bg-red-500/20 text-red-400"
                : "bg-blue-500/20 text-blue-400"
          }`}>
            {isReady ? (video.published ? "Live" : "Draft") : video.status === "REJECTED" ? "Rejected" : video.status}
          </span>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] font-medium bg-black/70 text-white px-1.5 py-0.5 rounded">
              {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {productCount} product{productCount !== 1 ? "s" : ""} tagged
          </p>
          <p className="text-xs text-muted">
            {new Date(video.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Tagged products */}
        {productCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.products.slice(0, 3).map((vp) => (
              <span
                key={vp.product.id}
                className="text-[10px] bg-surface px-2 py-0.5 rounded-full text-muted truncate max-w-[120px]"
              >
                {vp.product.name}
              </span>
            ))}
            {productCount > 3 && (
              <span className="text-[10px] text-muted">+{productCount - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {isReady && (
            <Button
              size="sm"
              variant={video.published ? "ghost" : "primary"}
              onClick={() => updateVideo.mutate({ id: video.id, published: !video.published })}
              loading={updateVideo.isPending}
              className="flex-1 text-xs"
            >
              {video.published ? "Unpublish" : "Publish"}
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this video?")) {
                deleteVideo.mutate(video.id);
              }
            }}
            loading={deleteVideo.isPending}
            className="text-xs"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
