"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface Creator {
  id: string;
  name: string | null;
  username: string | null;
  role: string;
}

interface UploadItem {
  id: string;
  file: File;
  title: string;
  status: "pending" | "uploading" | "processing" | "ready" | "error";
  progress: number;
  videoId: string | null;
  error: string | null;
}

export default function AdminUploadPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [pollIds, setPollIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch creators (and admins who can also own videos)
  useEffect(() => {
    fetch("/api/admin/creators?page=1")
      .then((r) => r.json())
      .then((data) => {
        const list = data.creators ?? [];
        setCreators(
          Array.isArray(list)
            ? list.map((c: { id: string; name: string | null; username: string | null }) => ({
                ...c,
                role: "CREATOR",
              }))
            : []
        );
      });
  }, []);

  // Poll for processing videos to check if they've become READY
  useEffect(() => {
    if (pollIds.size === 0) return;

    const interval = setInterval(async () => {
      const ids = Array.from(pollIds);
      for (const videoId of ids) {
        try {
          const res = await fetch(`/api/admin/videos/${videoId}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.status === "READY") {
            setUploads((prev) =>
              prev.map((u) =>
                u.videoId === videoId ? { ...u, status: "ready" } : u
              )
            );
            setPollIds((prev) => {
              const next = new Set(prev);
              next.delete(videoId);
              return next;
            });
          }
        } catch {
          // ignore poll errors
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pollIds]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newUploads: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      status: "pending",
      progress: 0,
      videoId: null,
      error: null,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Reset input so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateUpload = useCallback(
    (id: string, updates: Partial<UploadItem>) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
      );
    },
    []
  );

  const uploadSingle = useCallback(
    async (item: UploadItem) => {
      if (!selectedCreator) return;

      updateUpload(item.id, { status: "uploading", progress: 0 });

      try {
        // 1. Get presigned URL
        const presignRes = await fetch("/api/admin/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId: selectedCreator,
            title: item.title,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error ?? "Failed to get upload URL");
        }

        const { uploadUrl, videoId } = await presignRes.json();
        updateUpload(item.id, { videoId });

        // 2. Upload to Cloudflare via XHR for progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", uploadUrl);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              updateUpload(item.id, { progress });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed (${xhr.status})`));
          });

          xhr.addEventListener("error", () => reject(new Error("Upload failed")));

          const formData = new FormData();
          formData.append("file", item.file);
          xhr.send(formData);
        });

        // 3. Upload done — now waiting for Cloudflare to transcode
        updateUpload(item.id, { status: "processing", progress: 100 });
        setPollIds((prev) => new Set(prev).add(videoId));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        updateUpload(item.id, { status: "error", error: message });
      }
    },
    [selectedCreator, updateUpload]
  );

  const uploadAll = async () => {
    const pending = uploads.filter((u) => u.status === "pending");
    // Upload sequentially to avoid overwhelming the connection
    for (const item of pending) {
      await uploadSingle(item);
    }
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const readyCount = uploads.filter((u) => u.status === "ready").length;
  const processingCount = uploads.filter((u) => u.status === "processing").length;
  const pendingCount = uploads.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Upload Videos</h1>
        <p className="text-sm text-muted mt-1">
          Upload videos to Cloudflare Stream and assign them to creators. After processing, use Content Seeding to attach products.
        </p>
      </div>

      {/* Creator selection + file picker */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1.5">Assign to Merchant</label>
          <select
            value={selectedCreator}
            onChange={(e) => setSelectedCreator(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          >
            <option value="">Choose a merchant user...</option>
            {creators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.username ?? c.id} (@{c.username ?? "—"}) — {c.role}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer.files;
            if (files.length > 0 && fileInputRef.current) {
              // Programmatically set files via DataTransfer
              const dt = new DataTransfer();
              for (let i = 0; i < files.length; i++) dt.items.add(files[i]);
              fileInputRef.current.files = dt.files;
              fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
        >
          <svg
            className="w-10 h-10 mx-auto text-muted mb-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm text-text font-medium">
            Drop video files here or click to browse
          </p>
          <p className="text-xs text-muted mt-1">MP4, MOV, WebM — up to 500MB each</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {/* Upload all button */}
        {pendingCount > 0 && selectedCreator && (
          <button
            onClick={uploadAll}
            className="w-full py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
          >
            Upload {pendingCount} Video{pendingCount === 1 ? "" : "s"}
          </button>
        )}

        {pendingCount > 0 && !selectedCreator && (
          <p className="text-sm text-center text-warning">Select a merchant before uploading</p>
        )}
      </div>

      {/* Status bar */}
      {uploads.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted">
          {readyCount > 0 && (
            <span className="text-success font-medium">{readyCount} ready</span>
          )}
          {processingCount > 0 && (
            <span className="text-accent font-medium">{processingCount} processing</span>
          )}
          {pendingCount > 0 && (
            <span>{pendingCount} pending</span>
          )}
        </div>
      )}

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
            >
              {/* Status icon */}
              <div className="shrink-0">
                {item.status === "pending" && (
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                    <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                {item.status === "uploading" && (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
                {item.status === "processing" && (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                {item.status === "ready" && (
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
                {item.status === "error" && (
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-text font-medium truncate">{item.title}</p>
                  <span className="text-[10px] text-muted shrink-0">
                    {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                {/* Progress bar */}
                {(item.status === "uploading" || item.status === "processing") && (
                  <div className="mt-2 w-full h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === "processing"
                          ? "bg-accent animate-pulse"
                          : "bg-accent"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === "uploading" && (
                  <p className="text-[10px] text-muted mt-1">Uploading... {item.progress}%</p>
                )}
                {item.status === "processing" && (
                  <p className="text-[10px] text-accent mt-1">
                    Uploaded — Cloudflare is transcoding...
                  </p>
                )}
                {item.status === "ready" && (
                  <p className="text-[10px] text-success mt-1">
                    Ready — go to Content Seeding to attach products
                  </p>
                )}
                {item.status === "error" && (
                  <p className="text-[10px] text-destructive mt-1">{item.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0">
                {item.status === "pending" && (
                  <button
                    onClick={() => removeUpload(item.id)}
                    className="text-xs text-muted hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                )}
                {item.status === "error" && (
                  <button
                    onClick={() => {
                      updateUpload(item.id, {
                        status: "pending",
                        progress: 0,
                        error: null,
                      });
                    }}
                    className="text-xs text-accent hover:underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      {readyCount > 0 && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">
              {readyCount} video{readyCount === 1 ? " is" : "s are"} ready
            </p>
            <p className="text-xs text-muted mt-0.5">
              Attach merchant products to make them appear in the feed
            </p>
          </div>
          <a
            href="/admin/content-seeding"
            className="px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
          >
            Content Seeding
          </a>
        </div>
      )}
    </div>
  );
}
