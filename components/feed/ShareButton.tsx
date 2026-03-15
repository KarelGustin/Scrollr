"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  videoUrl?: string | null;
}

function getFileExtension(videoUrl: string) {
  const cleanUrl = videoUrl.split("?")[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase();
  if (!ext) return "mp4";
  if (ext === "mov" || ext === "webm" || ext === "m4v" || ext === "mp4") return ext;
  return "mp4";
}

function getMimeType(ext: string) {
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  if (ext === "m4v") return "video/x-m4v";
  return "video/mp4";
}

function isFileShareableVideoUrl(videoUrl: string) {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(videoUrl);
}

export default function ShareButton({ url, title, videoUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);

    const shareUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

    // Fire SHARE event
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ type: "SHARE", metadata: { url: shareUrl, hasVideo: !!videoUrl } }]),
    }).catch(() => {});

    try {
      // Try sharing a video file if a direct file URL is available.
      if (
        videoUrl &&
        navigator.share &&
        typeof navigator.canShare === "function" &&
        isFileShareableVideoUrl(videoUrl)
      ) {
        try {
          const response = await fetch(videoUrl, { mode: "cors" });
          if (response.ok) {
            const blob = await response.blob();
            const ext = getFileExtension(videoUrl);
            const file = new File([blob], `scrollr-video.${ext}`, {
              type: blob.type || getMimeType(ext),
            });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title,
                text: "Shared from Scrollr",
                files: [file],
              });
              return;
            }
          }
        } catch {
          // Fall back to URL sharing.
        }
      }

      // Try native URL share API
      if (navigator.share) {
        try {
          await navigator.share({ title, url: shareUrl });
          return;
        } catch {
          // User cancelled or not supported, fall through to clipboard
        }
      }

      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignore
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      disabled={sharing}
      className="flex items-center justify-center w-10 h-10 bg-bg/60 backdrop-blur-md rounded-full border border-white/10 transition-transform active:scale-95 disabled:opacity-70"
      title={sharing ? "Preparing share..." : copied ? "Link copied!" : "Share"}
    >
      {sharing ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
          <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" opacity="0.25" />
          <path d="M20 12a8 8 0 00-8-8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : copied ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}
