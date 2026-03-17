"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUpload } from "@/hooks/useUpload";
import { Spinner } from "@/components/ui/Spinner";

type PostingStep = "select" | "preview" | "details" | "success";

interface TaggedProduct {
  id: string;
  merchantProductId: string;
  title: string;
  imageUrl: string | null;
  price: number;
  vendor: string | null;
  merchantName: string | null;
}

interface MerchantOption {
  id: string;
  storeName: string | null;
}

export default function CreatePage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<PostingStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [taggedProducts, setTaggedProducts] = useState<TaggedProduct[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Product search state
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>("");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TaggedProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { progress, uploading, error: uploadError, upload, reset: resetUpload } = useUpload();

  // Load available merchants on mount
  useEffect(() => {
    fetch("/api/merchant-products?available=true&limit=1")
      .then((res) => res.json())
      .then(() => {
        // Fetch merchant list for filtering
        fetch("/api/create/merchants")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setMerchants(data);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  // Search products by merchant
  const searchProducts = useCallback(async (merchantId: string, query: string) => {
    if (!query.trim() && !merchantId) return;
    setSearchLoading(true);

    try {
      const params = new URLSearchParams({ available: "true", limit: "20" });
      if (query.trim()) params.set("search", query.trim());
      if (merchantId) params.set("merchantId", merchantId);

      const res = await fetch(`/api/merchant-products?${params}`);
      const data = await res.json();
      const products = data?.products ?? data;

      if (Array.isArray(products)) {
        setSearchResults(
          products.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            merchantProductId: p.id as string,
            title: p.title as string,
            imageUrl: p.imageUrl as string | null,
            price: p.price as number,
            vendor: p.vendor as string | null,
            merchantName: (p.merchant as Record<string, unknown>)?.storeName as string | null,
          }))
        );
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced product search
  useEffect(() => {
    if (!showProductSearch) return;
    const timer = setTimeout(() => {
      searchProducts(selectedMerchant, productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedMerchant, productSearch, showProductSearch, searchProducts]);

  // Auth gate
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login?callbackUrl=/create");
    return null;
  }

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video file
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    // Max 500MB
    if (file.size > 500 * 1024 * 1024) {
      alert("File size must be under 500MB");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setStep("preview");
  };

  const addProduct = (product: TaggedProduct) => {
    if (taggedProducts.length >= 5) return;
    if (taggedProducts.some((p) => p.merchantProductId === product.merchantProductId)) return;
    setTaggedProducts((prev) => [...prev, product]);
  };

  const removeProduct = (merchantProductId: string) => {
    setTaggedProducts((prev) => prev.filter((p) => p.merchantProductId !== merchantProductId));
  };

  // Upload and post
  const handlePost = async () => {
    if (!selectedFile) return;

    try {
      const videoId = await upload(selectedFile, {
        merchantProductIds: taggedProducts.map((p) => p.merchantProductId),
        caption,
      });

      if (videoId) {
        setStep("success");
      }
    } catch {
      // Error handled by useUpload
    }
  };

  const handleStartOver = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setCaption("");
    setTaggedProducts([]);
    setStep("select");
    resetUpload();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === "select" || step === "success") {
                router.back();
              } else if (step === "preview") {
                handleStartOver();
              } else if (step === "details") {
                setStep("preview");
              }
            }}
            className="text-muted hover:text-text transition-colors"
          >
            {step === "success" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            )}
          </button>
          <h1 className="text-lg font-display font-bold text-text">
            {step === "select" && "New Post"}
            {step === "preview" && "Preview"}
            {step === "details" && "Details"}
            {step === "success" && "Posted!"}
          </h1>
          <div className="w-5" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: Select video from gallery */}
        {step === "select" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
                <line x1="17" y1="17" x2="22" y2="17" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-text mb-2">
              Upload a video
            </h2>
            <p className="text-sm text-muted text-center mb-8 max-w-xs">
              Select a video from your gallery to share with the Scrollr community. Tag products to earn 5% commission on sales.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-8 py-4 bg-accent text-accent-fg rounded-2xl text-base font-semibold hover:bg-accent/90 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Choose from Gallery
            </button>

            <p className="text-xs text-muted mt-4">
              Max 500MB &middot; MP4, MOV, WebM
            </p>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && videoPreviewUrl && (
          <div className="space-y-6">
            {/* Video preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[60vh] mx-auto">
              <video
                ref={videoPreviewRef}
                src={videoPreviewUrl}
                className="w-full h-full object-contain"
                controls
                playsInline
                autoPlay
                muted
                loop
              />
            </div>

            {/* File info */}
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-muted">
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB` : ""}
                  </p>
                </div>
                <button
                  onClick={handleStartOver}
                  className="text-xs text-muted hover:text-destructive transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep("details")}
              className="w-full py-3 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Details — caption + tag products */}
        {step === "details" && (
          <div className="space-y-6">
            {/* Mini preview */}
            {videoPreviewUrl && (
              <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
                  <video
                    src={videoPreviewUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-muted">
                    {taggedProducts.length} product{taggedProducts.length !== 1 ? "s" : ""} tagged
                  </p>
                </div>
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="text-xs font-medium text-muted block mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                placeholder="Write a caption for your video..."
                rows={3}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text resize-none focus:outline-none focus:border-accent/50 placeholder:text-muted/60 transition-colors"
              />
              <p className={`text-xs mt-1 ${caption.length >= 280 ? "text-warning" : "text-muted"}`}>
                {caption.length}/300
              </p>
            </div>

            {/* Tagged Products */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted">
                  Tag Products ({taggedProducts.length}/5)
                </label>
                {taggedProducts.length < 5 && (
                  <button
                    onClick={() => setShowProductSearch(true)}
                    className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                  >
                    + Add Product
                  </button>
                )}
              </div>

              {taggedProducts.length === 0 ? (
                <button
                  onClick={() => setShowProductSearch(true)}
                  className="w-full py-4 border-2 border-dashed border-border rounded-xl text-sm text-muted hover:border-accent/50 hover:text-accent transition-colors"
                >
                  Tap to tag products from merchant stores
                </button>
              ) : (
                <div className="space-y-2">
                  {taggedProducts.map((product) => (
                    <div
                      key={product.merchantProductId}
                      className="flex items-center gap-3 bg-card rounded-xl border border-border p-3"
                    >
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-muted">
                          {product.merchantName} &middot; &euro;{product.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeProduct(product.merchantProductId)}
                        className="text-muted hover:text-destructive transition-colors p-1"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload error */}
            {uploadError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                <p className="text-sm text-destructive">{uploadError}</p>
              </div>
            )}

            {/* Post button */}
            <button
              onClick={handlePost}
              disabled={uploading}
              className="w-full py-3 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" className="text-accent-fg" />
                  Uploading... {progress}%
                </span>
              ) : (
                "Post to Scrollr"
              )}
            </button>

            {/* Upload progress bar */}
            {uploading && (
              <div className="w-full bg-border rounded-full h-1.5">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Success + Cross-posting */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-text mb-2">
              Video posted!
            </h2>
            <p className="text-sm text-muted text-center mb-6 max-w-xs">
              Your video is being processed and will appear in the feed shortly.
              {taggedProducts.length > 0 && (
                <> You tagged {taggedProducts.length} product{taggedProducts.length !== 1 ? "s" : ""} &mdash; earn 5% on every sale!</>
              )}
            </p>

            {/* Cross-post section */}
            {selectedFile && (
              <div className="w-full bg-card rounded-2xl border border-border p-4 mb-6">
                <p className="text-sm font-display font-bold text-text mb-1">
                  Cross-post to grow your reach
                </p>
                <p className="text-xs text-muted mb-4">
                  Share this video to your other platforms to drive traffic back to Scrollr
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (selectedFile && navigator.share) {
                        try {
                          await navigator.share({
                            title: caption || "Check this out on Scrollr!",
                            text: `${caption}\n\nShop the look on Scrollr`,
                            files: [selectedFile],
                          });
                        } catch {
                          // User cancelled share
                        }
                      } else {
                        // Fallback: download the file so user can upload manually
                        const a = document.createElement("a");
                        a.href = videoPreviewUrl || "";
                        a.download = selectedFile.name;
                        a.click();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    Instagram
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedFile && navigator.share) {
                        try {
                          await navigator.share({
                            title: caption || "Check this out on Scrollr!",
                            text: `${caption}\n\nShop the look on Scrollr`,
                            files: [selectedFile],
                          });
                        } catch {
                          // User cancelled share
                        }
                      } else {
                        const a = document.createElement("a");
                        a.href = videoPreviewUrl || "";
                        a.download = selectedFile.name;
                        a.click();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity border border-white/10"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.69h-1z" />
                    </svg>
                    TikTok
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-2 text-center">
                  Uses your device&apos;s share sheet to post directly
                </p>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={handleStartOver}
                className="flex-1 py-3 bg-card border border-border text-text rounded-xl text-sm font-semibold hover:bg-surface transition-colors"
              >
                Post Another
              </button>
              <button
                onClick={() => router.push("/feed")}
                className="flex-1 py-3 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Go to Feed
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Search Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 z-50" onClick={() => setShowProductSearch(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-2" />

            <div className="px-4 pb-3 border-b border-border">
              <h3 className="text-base font-display font-bold text-text mb-3">
                Tag a Product
              </h3>

              {/* Merchant filter */}
              <select
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text mb-2 focus:outline-none focus:border-accent/50"
              >
                <option value="">All Stores</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.storeName || "Unnamed Store"}
                  </option>
                ))}
              </select>

              {/* Product search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50 placeholder:text-muted/60"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="sm" className="text-accent" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">
                  {productSearch || selectedMerchant
                    ? "No products found"
                    : "Search for products to tag"}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((product) => {
                    const isTagged = taggedProducts.some(
                      (p) => p.merchantProductId === product.merchantProductId
                    );
                    return (
                      <button
                        key={product.merchantProductId}
                        onClick={() => {
                          if (isTagged) {
                            removeProduct(product.merchantProductId);
                          } else {
                            addProduct(product);
                          }
                        }}
                        disabled={!isTagged && taggedProducts.length >= 5}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                          isTagged
                            ? "border-accent bg-accent/5"
                            : "border-border bg-card hover:border-muted"
                        } disabled:opacity-40`}
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted">
                            {product.merchantName} &middot; &euro;{product.price.toFixed(2)}
                          </p>
                        </div>
                        {isTagged && (
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Done button */}
            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={() => setShowProductSearch(false)}
                className="w-full py-3 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Done ({taggedProducts.length} tagged)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
