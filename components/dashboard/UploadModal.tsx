"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useUpload } from "@/hooks/useUpload";
import { useQueryClient } from "@tanstack/react-query";
import { MerchantProductPicker } from "./MerchantProductPicker";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024;

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [step, setStep] = useState<"select" | "details" | "uploading" | "success">("select");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [selectedMerchantProductIds, setSelectedMerchantProductIds] = useState<string[]>([]);
  const [publishOnCreate, setPublishOnCreate] = useState(true);
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();

  const { progress, uploading, error: uploadError, upload, reset: resetUpload } = useUpload();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const resetAll = useCallback(() => {
    setStep("select");
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setCaption("");
    setLocation("");
    setSelectedMerchantProductIds([]);
    setPublishOnCreate(true);
    setCreatedVideoId(null);
    setError("");
    resetUpload();
  }, [resetUpload, videoPreviewUrl]);

  const handleClose = () => {
    if (uploading) return; // Don't allow closing during upload
    resetAll();
    onOpenChange(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File must be under 500MB");
      return;
    }
    setError("");
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setStep("details");
  };

  const handlePost = async () => {
    if (!videoFile) return;
    setStep("uploading");
    try {
      const videoId = await upload(videoFile, {
        merchantProductIds: selectedMerchantProductIds.length > 0 ? selectedMerchantProductIds : undefined,
        caption: caption || undefined,
        location: location || undefined,
      });
      setCreatedVideoId(videoId);

      // Update merchant products if needed
      if (selectedMerchantProductIds.length > 0) {
        await fetch(`/api/videos/${videoId}/products`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantProductIds: selectedMerchantProductIds }),
        }).catch(() => {});
      }

      // Publish
      if (publishOnCreate) {
        await fetch(`/api/videos/${videoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: true }),
        }).catch(() => {});
      }

      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["merchant-products"] });
      setStep("success");
    } catch {
      setStep("details");
    }
  };

  const handleShare = async () => {
    if (!createdVideoId) return;
    const shareUrl = `${window.location.origin}/discover`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: caption || "Check out my new post on Scrollr!",
          text: caption || "I just posted a new shoppable video on Scrollr",
          url: shareUrl,
        });
        return;
      } catch {
        // Cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Ignore
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-lg border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-12">
          {step === "select" || step === "success" ? (
            <button onClick={handleClose} className="text-sm text-muted hover:text-text transition-colors">
              {step === "success" ? "Done" : "Cancel"}
            </button>
          ) : step === "details" ? (
            <button onClick={() => { setStep("select"); setVideoFile(null); if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }} className="text-sm text-muted hover:text-text transition-colors">
              Back
            </button>
          ) : (
            <div />
          )}

          <h1 className="text-sm font-semibold text-text">
            {step === "select" ? "New Post" : step === "details" ? "New Post" : step === "uploading" ? "Posting..." : ""}
          </h1>

          {step === "details" ? (
            <button
              onClick={handlePost}
              disabled={uploading}
              className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
            >
              Post
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Step: Select Video */}
      {step === "select" && (
        <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "calc(100svh - 48px)" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {/* Gallery option */}
          <div className="w-full max-w-sm space-y-4">
            {/* Gallery button — primary action */}
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className="w-full flex items-center gap-4 p-4 bg-card border border-accent/30 rounded-2xl hover:bg-surface transition-colors active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text">Choose from Gallery</p>
                <p className="text-xs text-muted">Upload a video from your device</p>
              </div>
            </button>

            {/* Guidelines */}
            <div className="pt-4 text-center">
              <p className="text-xs text-muted">
                Max 10 minutes &middot; Up to 500MB &middot; Vertical recommended
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}
        </div>
      )}

      {/* Step: Details (Caption + Location + Products) */}
      {step === "details" && (
        <div className="overflow-y-auto" style={{ height: "calc(100svh - 48px)" }}>
          <div className="p-4 space-y-4 max-w-lg mx-auto">
            {/* Video preview + caption row */}
            <div className="flex gap-3">
              {/* Video thumbnail */}
              <div className="w-24 h-32 rounded-xl overflow-hidden bg-surface flex-shrink-0 relative">
                {videoPreviewUrl && (
                  <video
                    ref={previewVideoRef}
                    src={videoPreviewUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                )}
                {/* Scrollr watermark on preview */}
                <div className="absolute bottom-1 right-1 bg-black/40 backdrop-blur-sm rounded px-1 py-0.5">
                  <span className="text-[8px] font-bold text-white/80 tracking-wider">SCROLLR</span>
                </div>
              </div>

              {/* Caption */}
              <div className="flex-1 min-w-0">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                  placeholder="Write a caption..."
                  rows={4}
                  className="w-full bg-transparent text-sm text-text placeholder:text-muted resize-none focus:outline-none leading-relaxed"
                />
                <p className="text-xs text-muted text-right">{caption.length}/300</p>
              </div>
            </div>

            {/* Location field */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-surface border border-border rounded-xl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 100))}
                placeholder="Add location..."
                className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
              />
            </div>

            <div className="border-t border-border" />

            {/* Tag Products section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                  </svg>
                  <span className="text-sm font-medium text-text">Tag Products</span>
                  <span className="text-xs text-muted">({selectedMerchantProductIds.length}/7)</span>
                </div>
              </div>

              {/* Merchant products picker */}
              <MerchantProductPicker
                selectedIds={selectedMerchantProductIds}
                onSelectionChange={(ids) => setSelectedMerchantProductIds(ids.slice(0, 7))}
                maxSelections={7}
              />
            </div>

            <div className="border-t border-border" />

            {/* Publish toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-text">Publish immediately</p>
                <p className="text-xs text-muted">Make visible in your feed</p>
              </div>
              <button
                onClick={() => setPublishOnCreate(!publishOnCreate)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  publishOnCreate ? "bg-accent" : "bg-surface border border-border"
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    publishOnCreate ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Scrollr watermark notice */}
            <div className="flex items-center gap-2 py-2 px-3 bg-surface rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-xs text-muted">A Scrollr watermark will appear on your video</p>
            </div>

            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}

            {/* Mobile-friendly post button at bottom */}
            <div className="pt-2 pb-safe">
              <button
                onClick={handlePost}
                disabled={uploading || !videoFile}
                className="w-full py-3.5 bg-accent text-accent-fg text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors active:scale-[0.98]"
              >
                {publishOnCreate ? "Post Now" : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Uploading */}
      {step === "uploading" && (
        <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "calc(100svh - 48px)" }}>
          <div className="w-full max-w-xs space-y-6 text-center">
            {/* Video thumbnail */}
            <div className="w-32 h-44 rounded-2xl overflow-hidden bg-surface mx-auto relative">
              {videoPreviewUrl && (
                <video
                  src={videoPreviewUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  loop
                />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-3 border-white/30 border-t-white animate-spin" />
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold text-text">Uploading your video...</p>
              <p className="text-sm text-muted mt-1">This may take a moment</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted">{progress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "calc(100svh - 48px)" }}>
          <div className="w-full max-w-sm text-center space-y-6">
            {/* Success animation */}
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-in zoom-in duration-300">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-text">Your post is live!</h2>
              <p className="text-sm text-muted mt-2">Share it with your followers on social media</p>
            </div>

            {/* Video preview */}
            {videoPreviewUrl && (
              <div className="w-28 h-40 rounded-2xl overflow-hidden bg-surface mx-auto relative shadow-lg">
                <video
                  src={videoPreviewUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  loop
                />
                {/* Scrollr watermark */}
                <div className="absolute bottom-1.5 right-1.5 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span className="text-[9px] font-bold text-white/80 tracking-wider">SCROLLR</span>
                </div>
              </div>
            )}

            {/* Share button — Apple style */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-accent text-accent-fg text-sm font-bold rounded-2xl hover:bg-accent/90 transition-colors active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </button>

            {/* Social share options */}
            <div className="flex items-center justify-center gap-4">
              <ShareSocialButton
                label="Stories"
                color="bg-gradient-to-br from-pink-500 to-orange-400"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" />
                  </svg>
                }
                onClick={() => {
                  window.open(`https://www.instagram.com/`, "_blank");
                }}
              />
              <ShareSocialButton
                label="TikTok"
                color="bg-black"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.79a8.18 8.18 0 004.76 1.52V6.85a4.84 4.84 0 01-1-.16z" />
                  </svg>
                }
                onClick={() => {
                  window.open(`https://www.tiktok.com/`, "_blank");
                }}
              />
              <ShareSocialButton
                label="X"
                color="bg-black"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                }
                onClick={() => {
                  const text = encodeURIComponent(caption || "Check out my new post on Scrollr!");
                  const url = encodeURIComponent(`${window.location.origin}/discover`);
                  window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, "_blank");
                }}
              />
              <ShareSocialButton
                label="Copy"
                color="bg-surface border border-border"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                }
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}/discover`);
                  } catch {}
                }}
              />
            </div>

            {/* Done button */}
            <button
              onClick={handleClose}
              className="w-full py-3 text-sm font-medium text-muted hover:text-text transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShareSocialButton({
  label,
  color,
  icon,
  onClick,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center transition-transform group-active:scale-90`}>
        {icon}
      </div>
      <span className="text-[11px] text-muted">{label}</span>
    </button>
  );
}
