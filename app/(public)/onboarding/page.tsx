"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/Spinner";

const STEPS = [
  {
    id: "username",
    title: "Choose your username",
    description: "This will be your unique link: scrollr.io/@username",
  },
  {
    id: "profile",
    title: "Set up your profile",
    description: "Tell your audience who you are",
  },
  {
    id: "ready",
    title: "You're all set!",
    description: "Start creating shoppable video content",
  },
];

export default function OnboardingPage() {
  const { user, status, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login?callbackUrl=/onboarding");
    return null;
  }

  const showHeightField = user.role === "CREATOR" || user.role === "ADMIN";

  const checkUsername = async (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);
    if (value.length < 3) return;

    try {
      const res = await fetch(`/api/user/username?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      // ignore
    }
  };

  const handleSetUsername = async () => {
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to set username");
        return;
      }

      setStep(1);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSetProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          bio: bio || undefined,
          heightCm: showHeightField && heightCm ? Number(heightCm) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
        return;
      }

      await refreshUser();
      setStep(2);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (user?.role === "CREATOR" || user?.role === "ADMIN") {
      router.push("/dashboard");
    } else if (user?.role === "MERCHANT") {
      router.push("/merchant");
    } else {
      router.push("/discover");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
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

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Username</label>
                <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50">
                  <span className="px-3 text-sm text-muted">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="yourname"
                    maxLength={20}
                    className="flex-1 bg-transparent px-0 py-2.5 text-sm text-text focus:outline-none"
                  />
                  {usernameAvailable !== null && (
                    <span className={`px-3 text-sm ${usernameAvailable ? "text-green-400" : "text-destructive"}`}>
                      {usernameAvailable ? "Available" : "Taken"}
                    </span>
                  )}
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                onClick={handleSetUsername}
                disabled={loading || !username || username.length < 3 || usernameAvailable === false}
                className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
              >
                {loading ? "Setting up..." : "Continue"}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={50}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  maxLength={160}
                  rows={3}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text resize-none focus:outline-none focus:border-accent/50"
                />
                <p className="text-xs text-muted mt-1">{bio.length}/160</p>
              </div>
              {showHeightField && (
                <div>
                  <label className="text-xs text-muted block mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    min="120"
                    max="250"
                    inputMode="numeric"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
                    placeholder="178"
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                  />
                  <p className="text-xs text-muted mt-1">
                    Used as a live fit guide on your tagged products.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(2); refreshUser(); }}
                  className="flex-1 py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-xl hover:bg-surface transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSetProfile}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
                >
                  {loading ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-muted mb-6">
                Your account is ready. Add products, upload videos, and start selling.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleFinish}
                  className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
}
