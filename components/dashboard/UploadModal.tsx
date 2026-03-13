"use client";

import { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProductPicker } from "./ProductPicker";
import { useUpload } from "@/hooks/useUpload";
import { useQueryClient } from "@tanstack/react-query";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishOnCreate, setPublishOnCreate] = useState(false);
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();

  const { progress, uploading, error: uploadError, upload, reset: resetUpload } = useUpload();

  const resetAll = useCallback(() => {
    setStep(1);
    setVideoFile(null);
    setSelectedProductIds([]);
    setErrors({});
    setPublishOnCreate(false);
    setCreatedVideoId(null);
    resetUpload();
  }, [resetUpload]);

  const handleClose = (open: boolean) => {
    if (!open) resetAll();
    onOpenChange(open);
  };

  // Step 1: Video upload
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrors({ video: "Please select a video file" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors({ video: "File must be under 500MB" });
      return;
    }
    setErrors({});
    setVideoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return;
    try {
      const videoId = await upload(videoFile, selectedProductIds.length > 0 ? selectedProductIds : undefined);
      setCreatedVideoId(videoId);
      setStep(2);
    } catch {
      // error shown via uploadError state
    }
  };

  // Step 3: Publish
  const handleGoLive = async () => {
    if (!createdVideoId) return;

    // Update video products if changed in step 2
    if (selectedProductIds.length > 0) {
      await fetch(`/api/videos/${createdVideoId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProductIds }),
      }).catch(() => {});
    }

    if (publishOnCreate) {
      await fetch(`/api/videos/${createdVideoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      }).catch(() => {});
    }

    queryClient.invalidateQueries({ queryKey: ["videos"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    handleClose(false);
  };

  const stepTitles = ["Upload Video", "Tag Products", "Preview & Publish"];

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={stepTitles[step - 1]}
      description={
        step === 1
          ? "Upload a short video to showcase products"
          : step === 2
          ? "Select products to tag in this video"
          : "Review and publish your video"
      }
    >
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              s === step
                ? "bg-accent"
                : s < step
                ? "bg-accent/40"
                : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Video Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-accent bg-accent/5"
                : videoFile
                ? "border-green-500/50 bg-green-500/5"
                : "border-border hover:border-muted"
            }`}
          >
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
            {videoFile ? (
              <div>
                <svg className="mx-auto mb-2 text-green-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className="text-sm font-medium text-text">{videoFile.name}</p>
                <p className="text-xs text-muted mt-1">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto mb-2 text-muted" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-text font-medium">
                  Drop your video here or click to browse
                </p>
                <p className="text-xs text-muted mt-1">
                  Accepts video files up to 500MB
                </p>
              </div>
            )}
          </div>

          {errors.video && (
            <p className="text-sm text-destructive">{errors.video}</p>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleUploadVideo}
              loading={uploading}
              disabled={!videoFile}
            >
              Upload & Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Tag Products */}
      {step === 2 && (
        <div className="space-y-4">
          <ProductPicker
            selectedIds={selectedProductIds}
            onSelectionChange={setSelectedProductIds}
          />

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(3)}>
                {selectedProductIds.length === 0 ? "Skip" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Publish */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Phone mockup preview */}
          <div className="flex justify-center">
            <div className="relative w-48 rounded-[2rem] border-4 border-card bg-bg p-2 shadow-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-card rounded-b-2xl" />
              <div className="rounded-[1.5rem] overflow-hidden bg-surface aspect-[9/16] flex flex-col items-center justify-center">
                {videoFile ? (
                  <video
                    src={URL.createObjectURL(videoFile)}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <div className="text-center p-4">
                    <p className="text-[10px] text-muted">No video</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Video</span>
              <span className="text-sm text-text">{videoFile?.name ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Tagged Products</span>
              <span className="text-sm text-text">{selectedProductIds.length}</span>
            </div>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between bg-card rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-text">Publish immediately</p>
              <p className="text-xs text-muted">
                Make this video visible in your feed
              </p>
            </div>
            <button
              onClick={() => setPublishOnCreate(!publishOnCreate)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                publishOnCreate ? "bg-accent" : "bg-card border border-border"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  publishOnCreate ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleGoLive}>
              {publishOnCreate ? "Go Live" : "Save as Draft"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
