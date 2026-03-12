"use client";

import { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateProduct } from "@/hooks/useProducts";
import { useUpload } from "@/hooks/useUpload";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    affiliateUrl: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [publishOnCreate, setPublishOnCreate] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const createProduct = useCreateProduct();
  const { progress, uploading, error: uploadError, upload, reset: resetUpload } = useUpload();

  const resetAll = useCallback(() => {
    setStep(1);
    setForm({ name: "", brand: "", price: "", affiliateUrl: "", description: "" });
    setErrors({});
    setVideoFile(null);
    setPublishOnCreate(false);
    setCreatedProductId(null);
    resetUpload();
    createProduct.reset();
  }, [resetUpload, createProduct]);

  const handleClose = (open: boolean) => {
    if (!open) resetAll();
    onOpenChange(open);
  };

  // Step 1: Validate details
  const validateDetails = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.affiliateUrl.trim()) {
      newErrors.affiliateUrl = "Affiliate URL is required";
    } else {
      try {
        new URL(form.affiliateUrl);
      } catch {
        newErrors.affiliateUrl = "Must be a valid URL";
      }
    }
    if (form.description.length > 200) {
      newErrors.description = "Description must be 200 characters or less";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextFromDetails = async () => {
    if (!validateDetails()) return;
    // Create product first so we have an ID for video upload
    try {
      const product = await createProduct.mutateAsync({
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        price: form.price.trim() || undefined,
        affiliateUrl: form.affiliateUrl.trim(),
        description: form.description.trim() || undefined,
      });
      setCreatedProductId(product.id);
      setStep(2);
    } catch {
      // createProduct error is shown via mutation state
    }
  };

  // Step 2: Video upload
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
    if (!videoFile || !createdProductId) return;
    try {
      await upload(videoFile, createdProductId);
      setStep(3);
    } catch {
      // error shown via uploadError state
    }
  };

  // Step 3: Publish
  const handleGoLive = async () => {
    if (!createdProductId) return;
    if (publishOnCreate) {
      try {
        await fetch(`/api/products/${createdProductId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: true }),
        });
      } catch {
        // silently fail; user can publish later
      }
    }
    handleClose(false);
  };

  const stepTitles = ["Product Details", "Upload Video", "Preview & Publish"];

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={stepTitles[step - 1]}
      description={
        step === 1
          ? "Enter your product information"
          : step === 2
          ? "Upload a short video showcasing your product"
          : "Review and publish your product"
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

      {/* Step 1: Product Details */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Product Name"
            placeholder="e.g. Summer Glow Palette"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Brand"
            placeholder="e.g. Glossier"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
          <Input
            label="Price"
            placeholder="e.g. $29.99"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            label="Affiliate URL"
            placeholder="https://..."
            value={form.affiliateUrl}
            onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
            error={errors.affiliateUrl}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">
              Description{" "}
              <span className="text-xs">({form.description.length}/200)</span>
            </label>
            <textarea
              className="w-full px-3 py-2 bg-surface border border-border rounded-[var(--radius)] text-text placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 transition-all duration-200 ease-out resize-none"
              rows={3}
              placeholder="Short description of the product..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={200}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {createProduct.error && (
            <p className="text-sm text-destructive">
              {createProduct.error.message}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleNextFromDetails}
              loading={createProduct.isPending}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Video Upload */}
      {step === 2 && (
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
                <svg
                  className="mx-auto mb-2 text-green-400"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  className="mx-auto mb-2 text-muted"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep(3)}
              >
                Skip
              </Button>
              <Button
                onClick={handleUploadVideo}
                loading={uploading}
                disabled={!videoFile}
              >
                Upload & Next
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
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-card rounded-b-2xl" />
              {/* Screen */}
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
                    <svg
                      className="mx-auto text-muted mb-2"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <p className="text-[10px] text-muted">No video</p>
                  </div>
                )}
                {/* Product overlay */}
                <div className="absolute bottom-6 left-2 right-2">
                  <div className="bg-bg/80 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-[10px] font-semibold text-text truncate">
                      {form.name}
                    </p>
                    {form.price && (
                      <p className="text-[9px] text-accent">{form.price}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product summary */}
          <div className="bg-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Name</span>
              <span className="text-sm text-text">{form.name}</span>
            </div>
            {form.brand && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Brand</span>
                <span className="text-sm text-text">{form.brand}</span>
              </div>
            )}
            {form.price && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Price</span>
                <span className="text-sm text-accent">{form.price}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Video</span>
              <span className="text-sm text-text">
                {videoFile ? videoFile.name : "No video"}
              </span>
            </div>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between bg-card rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-text">Publish immediately</p>
              <p className="text-xs text-muted">
                Make this product visible in your feed
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
