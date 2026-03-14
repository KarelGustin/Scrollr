"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/Spinner";

const STEPS = [
  { id: "username", title: "Choose your username", description: "This will be your unique store link" },
  { id: "store", title: "Set up your store", description: "Tell customers about your brand" },
  { id: "shopify", title: "Connect Shopify", description: "Optional — you can connect later" },
  { id: "ready", title: "You're all set!", description: "Your store is ready to go" },
];

export default function MerchantOnboardingPage() {
  const { user, status, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [category, setCategory] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("");
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
    router.replace("/merchant-register");
    return null;
  }

  const checkUsername = async (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);
    if (value.length < 3) return;
    try {
      const res = await fetch(`/api/user/username?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch { /* ignore */ }
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

  const handleStoreDetails = async () => {
    if (!storeName.trim()) {
      setError("Store name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Register as merchant
      const res = await fetch("/api/merchant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeLogoUrl: storeLogoUrl || undefined,
          category: category || undefined,
          shopifyDomain: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, "")}.myshopify.com`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create store");
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

  const handleShopify = async () => {
    if (shopifyDomain.trim()) {
      setLoading(true);
      try {
        await fetch("/api/merchant/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopifyDomain }),
        });
      } catch { /* ignore */ }
      setLoading(false);
    }
    setStep(3);
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

        <div className="bg-card rounded-2xl border border-border p-6">
          <h1 className="text-xl font-display font-bold text-text mb-1">
            {STEPS[step].title}
          </h1>
          <p className="text-sm text-muted mb-6">{STEPS[step].description}</p>

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
                    placeholder="yourstore"
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
                <label className="text-xs text-muted block mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="My Awesome Store"
                  maxLength={50}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Logo URL (optional)</label>
                <input
                  type="url"
                  value={storeLogoUrl}
                  onChange={(e) => setStoreLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                >
                  <option value="">Select a category</option>
                  <option value="fashion">Fashion</option>
                  <option value="beauty">Beauty</option>
                  <option value="electronics">Electronics</option>
                  <option value="fitness">Fitness</option>
                  <option value="home">Home & Living</option>
                  <option value="food">Food & Drink</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                onClick={handleStoreDetails}
                disabled={loading || !storeName.trim()}
                className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
              >
                {loading ? "Creating store..." : "Continue"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Shopify Domain (optional)</label>
                <input
                  type="text"
                  value={shopifyDomain}
                  onChange={(e) => setShopifyDomain(e.target.value)}
                  placeholder="mystore.myshopify.com"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                />
                <p className="text-xs text-muted mt-1">You can connect this later from settings</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-card border border-border text-text text-sm font-semibold rounded-xl hover:bg-surface transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleShopify}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
                >
                  {loading ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-muted mb-6">
                Your store is ready. Add products, track sales, and grow your business.
              </p>
              <button
                onClick={() => router.push("/merchant")}
                className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
