"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/Spinner";
import type { CreatorApplicationData } from "@/types";

const CATEGORIES = [
  { id: "fashion", label: "Fashion", emoji: "👗" },
  { id: "beauty", label: "Beauty", emoji: "💄" },
  { id: "tech", label: "Tech", emoji: "📱" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "food", label: "Food", emoji: "🍳" },
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "art", label: "Art & Design", emoji: "🎨" },
  { id: "other", label: "Other", emoji: "✨" },
];

const PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "@yourusername",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "@yourusername",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.69h-1z" />
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "youtube.com/c/yourchannel",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X / Twitter",
    placeholder: "@yourusername",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

const FOLLOWER_RANGES = [
  { id: "1k-5k", label: "1K - 5K" },
  { id: "5k-10k", label: "5K - 10K" },
  { id: "10k-50k", label: "10K - 50K" },
  { id: "50k-100k", label: "50K - 100K" },
  { id: "100k+", label: "100K+" },
];

const STEPS = [
  { id: "category", title: "What do you create?", description: "Pick the category that best describes your content" },
  { id: "socials", title: "Your social presence", description: "Link your main account so we can verify you" },
  { id: "verify", title: "Verify your reach", description: "Select your primary platform and follower count" },
  { id: "pitch", title: "Tell us about yourself", description: "A short pitch about what you create" },
  { id: "review", title: "Review & submit", description: "Make sure everything looks good" },
];

export default function ApplyPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [primaryPlatform, setPrimaryPlatform] = useState("");
  const [followerRange, setFollowerRange] = useState("");
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Check existing application
  const [existingApp, setExistingApp] = useState<CreatorApplicationData | null>(null);
  const [checkingApp, setCheckingApp] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    // If already a creator, redirect
    if (user?.role === "CREATOR" || user?.role === "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    fetch("/api/creator-application")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === "PENDING") {
          setExistingApp(data);
        }
        setCheckingApp(false);
      })
      .catch(() => setCheckingApp(false));
  }, [status, user, router]);

  if (status === "loading" || checkingApp) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    router.replace("/login?callbackUrl=/apply");
    return null;
  }

  // Already pending
  if (existingApp?.status === "PENDING") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-xl font-display font-bold text-text mb-2">
              Application under review
            </h1>
            <p className="text-sm text-muted mb-6">
              We&apos;re reviewing your application. You&apos;ll hear back from us soon.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasSocialLink = Object.values(socialLinks).some((v) => v.trim());

  const canProceed = () => {
    if (step === 0) return !!category;
    if (step === 1) return hasSocialLink;
    if (step === 2) return !!primaryPlatform && !!followerRange;
    if (step === 3) return pitch.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/creator-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, socialLinks, pitch, primaryPlatform, followerRange }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit application");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-display font-bold text-text mb-2">
              Application submitted!
            </h1>
            <p className="text-sm text-muted mb-6">
              We&apos;ll review your application and get back to you soon. In the meantime, feel free to explore.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/discover")}
                className="w-full py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-xl hover:bg-surface transition-colors"
              >
                Explore Content
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-accent" : "bg-card"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h1 className="text-xl font-display font-bold text-text mb-1">
            {STEPS[step].title}
          </h1>
          <p className="text-sm text-muted mb-6">
            {STEPS[step].description}
          </p>

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-150 border ${
                      category === cat.id
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border bg-surface text-text hover:border-muted"
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!canProceed()}
                className="w-full py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1: Social Links */}
          {step === 1 && (
            <div className="space-y-4">
              {PLATFORMS.map((platform) => (
                <div key={platform.id}>
                  <label className="text-xs text-muted block mb-1.5">
                    {platform.label}
                  </label>
                  <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50 transition-colors">
                    <span className="px-3 text-muted">{platform.icon}</span>
                    <input
                      type="text"
                      value={socialLinks[platform.id] || ""}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({
                          ...prev,
                          [platform.id]: e.target.value,
                        }))
                      }
                      placeholder={platform.placeholder}
                      className="flex-1 bg-transparent px-0 py-2.5 text-sm text-text focus:outline-none placeholder:text-muted/60"
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted">At least one link is required so we can verify your audience.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-xl hover:bg-surface transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className="flex-1 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Verify — Primary platform + follower count */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-muted mb-2">Primary platform</p>
                <p className="text-xs text-muted mb-3">Which platform has your largest audience?</p>
                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.filter((p) => socialLinks[p.id]?.trim()).map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setPrimaryPlatform(platform.id)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-150 border ${
                        primaryPlatform === platform.id
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-border bg-surface text-text hover:border-muted"
                      }`}
                    >
                      <span className="text-muted">{platform.icon}</span>
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted mb-2">Follower count</p>
                <p className="text-xs text-muted mb-3">Approximate followers on your primary platform</p>
                <div className="grid grid-cols-2 gap-2">
                  {FOLLOWER_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setFollowerRange(range.id)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 border ${
                        followerRange === range.id
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-border bg-surface text-text hover:border-muted"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-xs text-muted">
                  We&apos;ll verify your follower count on {primaryPlatform ? PLATFORMS.find((p) => p.id === primaryPlatform)?.label : "your platform"} before approving. Creators earn <span className="text-accent font-semibold">5% commission</span> on every sale from their content.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-xl hover:bg-surface transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className="flex-1 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pitch */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <textarea
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value.slice(0, 200))}
                  placeholder="I create styling videos and review affordable fashion finds for my 50k Instagram audience..."
                  rows={4}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text resize-none focus:outline-none focus:border-accent/50 placeholder:text-muted/60 transition-colors"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted">What do you create? Who&apos;s your audience?</p>
                  <p className={`text-xs ${pitch.length >= 180 ? "text-warning" : "text-muted"}`}>
                    {pitch.length}/200
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-xl hover:bg-surface transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceed()}
                  className="flex-1 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Category */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Category</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORIES.find((c) => c.id === category)?.emoji}</span>
                    <span className="text-sm font-medium text-text">
                      {CATEGORIES.find((c) => c.id === category)?.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setStep(0)}
                  className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="h-px bg-border" />

              {/* Social links */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted mb-2">Social Links</p>
                  <div className="space-y-1.5">
                    {Object.entries(socialLinks)
                      .filter(([, v]) => v.trim())
                      .map(([platform, handle]) => (
                        <div key={platform} className="flex items-center gap-2">
                          <span className="text-muted">
                            {PLATFORMS.find((p) => p.id === platform)?.icon}
                          </span>
                          <span className="text-sm text-text">{handle}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="h-px bg-border" />

              {/* Verification */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted mb-2">Verification</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted">
                        {PLATFORMS.find((p) => p.id === primaryPlatform)?.icon}
                      </span>
                      <span className="text-sm font-medium text-text">
                        {PLATFORMS.find((p) => p.id === primaryPlatform)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-text">
                      {FOLLOWER_RANGES.find((r) => r.id === followerRange)?.label} followers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="h-px bg-border" />

              {/* Pitch */}
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-xs text-muted mb-1">Pitch</p>
                  <p className="text-sm text-text">{pitch}</p>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs text-accent hover:text-accent/80 font-medium transition-colors shrink-0"
                >
                  Edit
                </button>
              </div>

              {/* Commission info */}
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
                <p className="text-xs text-text font-medium mb-1">What you&apos;ll earn</p>
                <p className="text-xs text-muted">
                  As an approved creator, you earn <span className="text-accent font-semibold">5% commission</span> on every sale driven by your content. Minimum target: <span className="font-medium text-text">10 posts/month</span>.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-xl hover:bg-surface transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom link */}
        <p className="text-center text-xs text-muted mt-6">
          Just want to browse?{" "}
          <button onClick={() => router.push("/discover")} className="text-accent hover:text-accent/80 transition-colors">
            Explore content
          </button>
        </p>
      </div>
    </div>
  );
}
