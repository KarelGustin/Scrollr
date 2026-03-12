"use client";

import { useState, useCallback } from "react";

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
  videoId: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
    videoId: null,
  });

  const upload = useCallback(async (file: File, productId: string) => {
    setState({ progress: 0, uploading: true, error: null, videoId: null });

    try {
      // Get pre-signed upload URL
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, videoId } = await presignRes.json();

      // Upload to Cloudflare Stream via XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setState((prev) => ({ ...prev, progress }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
      });

      setState((prev) => ({
        ...prev,
        uploading: false,
        videoId,
        progress: 100,
      }));

      return videoId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setState((prev) => ({ ...prev, uploading: false, error: message }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null, videoId: null });
  }, []);

  return { ...state, upload, reset };
}
