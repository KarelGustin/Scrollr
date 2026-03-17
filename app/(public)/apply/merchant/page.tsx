"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/Spinner";

const STORE_TYPES = [
  {
    id: "shopify",
    label: "Shopify",
    description: "Connect your Shopify store",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "woocommerce",
    label: "WooCommerce",
    description: "Connect your WooCommerce store",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: "csv",
    label: "CSV Import",
    description: "Upload products via spreadsheet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "other",
    label: "Other Platform",
    description: "Custom website or marketplace",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
];

const CATEGORIES = [
  { id: "fashion", label: "Fashion & Apparel" },
  { id: "beauty", label: "Beauty & Skincare" },
  { id: "jewelry", label: "Jewelry & Accessories" },
  { id: "home", label: "Home & Living" },
  { id: "electronics", label: "Electronics & Tech" },
  { id: "sports", label: "Sports & Outdoors" },
  { id: "food", label: "Food & Beverages" },
  { id: "art", label: "Art & Collectibles" },
  { id: "other", label: "Other" },
];

const REVENUE_RANGES = [
  { id: "0-5k", label: "Under €5K/mo" },
  { id: "5k-25k", label: "€5K – €25K/mo" },
  { id: "25k-100k", label: "€25K – €100K/mo" },
  { id: "100k+", label: "€100K+/mo" },
  { id: "new", label: "Just starting out" },
];

const STEPS = [
  { id: "brand", title: "Your brand", subtitle: "Tell us about your store" },
  { id: "platform", title: "Your platform", subtitle: "Where do you sell today?" },
  { id: "details", title: "A bit more about you", subtitle: "Help us understand your business" },
  { id: "review", title: "Almost there", subtitle: "Review your application" },
];

export default function MerchantApplyPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [storeType, setStoreType] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [existingApp, setExistingApp] = useState<{ status: string } | null>(null);
  const [checkingApp, setCheckingApp] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    if (user?.role === "MERCHANT") {
      router.replace("/merchant");
      return;
    }

    fetch("/api/merchant-application")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === "PENDING") {
          setExistingApp(data);
        }
        setCheckingApp(false);
      })
      .catch(() => setCheckingApp(false));
  }, [status, user, router]);

  const goForward = (nextStep: number) => {
    setDirection("forward");
    setStep(nextStep);
  };

  const goBack = (prevStep: number) => {
    setDirection("back");
    setStep(prevStep);
  };

  if (status === "loading" || checkingApp) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    router.replace("/login?callbackUrl=/apply/merchant");
    return null;
  }

  // Pending application
  if (existingApp?.status === "PENDING") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-text mb-2">
              Application under review
            </h1>
            <p className="text-sm text-muted mb-8 leading-relaxed">
              We&apos;re carefully reviewing your merchant application. You&apos;ll receive an email once we&apos;ve made a decision — usually within 24–48 hours.
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all duration-200"
            >
              Back to Scrollr
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canProceed = () => {
    if (step === 0) return storeName.trim().length >= 2;
    if (step === 1) return !!storeType;
    if (step === 2) return !!category && description.trim().length >= 10;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const socialLinks: Record<string, string> = {};
      if (instagram.trim()) socialLinks.instagram = instagram.trim();
      if (website.trim()) socialLinks.website = website.trim();

      const res = await fetch("/api/merchant-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeUrl: storeUrl || undefined,
          storeType,
          category,
          description,
          monthlyRevenue: monthlyRevenue || undefined,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        }),
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

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            {/* Animated check */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="animate-[checkDraw_0.6s_ease-out_0.2s_both]">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-accent/30" />
                <polyline points="8 12 11 15 16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-text mb-2">
              Application submitted
            </h1>
            <p className="text-sm text-muted mb-2 leading-relaxed">
              Thank you for applying to sell on Scrollr.
            </p>
            <p className="text-sm text-muted mb-8 leading-relaxed">
              We&apos;ll review your application and get back to you within 24–48 hours. You&apos;ll receive a notification when your store is approved.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/discover")}
                className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all duration-200"
              >
                Explore Scrollr
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 bg-surface border border-border text-text text-sm font-semibold rounded-xl hover:bg-card transition-all duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const slideClass = direction === "forward"
    ? "animate-[slideInRight_0.3s_ease-out]"
    : "animate-[slideInLeft_0.3s_ease-out]";

  return (
    <div className="min-h-screen bg-bg">
      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes checkDraw {
          from { opacity: 0; stroke-dashoffset: 30; }
          to { opacity: 1; stroke-dashoffset: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-muted hover:text-text transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">Become a Merchant</span>
          <div className="w-5" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  i < step ? "bg-accent w-full" : i === step ? "bg-accent w-full" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mb-8">Step {step + 1} of {STEPS.length}</p>

        {/* Step content */}
        <div key={step} className={slideClass}>
          <h1 className="text-2xl font-display font-bold text-text mb-1">
            {STEPS[step].title}
          </h1>
          <p className="text-sm text-muted mb-8">
            {STEPS[step].subtitle}
          </p>

          {/* Step 0: Brand */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Store name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value.slice(0, 100))}
                  placeholder="My Amazing Store"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-text text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-muted/40 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  Store URL <span className="font-normal text-muted/60">(optional)</span>
                </label>
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://mystore.com"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-text text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-muted/40 transition-all"
                />
              </div>

              {/* Value prop */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text mb-1">Reach millions of shoppers</p>
                    <p className="text-xs text-muted leading-relaxed">
                      Your products get featured in creator videos and shown to an engaged audience ready to buy. You keep <span className="text-text font-medium">85% of every sale</span>.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => goForward(1)}
                disabled={!canProceed()}
                className="w-full py-3.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-all duration-200 active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1: Platform */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {STORE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setStoreType(type.id)}
                    className={`relative flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${
                      storeType === type.id
                        ? "border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(var(--accent-rgb,255,107,74),0.1)]"
                        : "border-border bg-surface hover:border-muted/50 hover:bg-card"
                    }`}
                  >
                    <div className={`mb-3 transition-colors ${storeType === type.id ? "text-accent" : "text-muted"}`}>
                      {type.icon}
                    </div>
                    <p className={`text-sm font-semibold mb-0.5 ${storeType === type.id ? "text-accent" : "text-text"}`}>
                      {type.label}
                    </p>
                    <p className="text-[11px] text-muted leading-snug">{type.description}</p>
                    {storeType === type.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {storeType === "csv" && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex gap-3 items-start animate-[fadeIn_0.3s_ease-out]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p className="text-xs text-muted leading-relaxed">
                    CSV import lets you upload your product catalog via a spreadsheet. Perfect for stores not on Shopify or WooCommerce.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => goBack(0)}
                  className="flex-1 py-3.5 bg-surface border border-border text-text text-sm font-semibold rounded-xl hover:bg-card transition-all duration-200 active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  onClick={() => goForward(2)}
                  disabled={!canProceed()}
                  className="flex-1 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-all duration-200 active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Product category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-4 py-2.5 rounded-full text-xs font-medium border transition-all duration-150 active:scale-[0.96] ${
                        category === cat.id
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted hover:text-text hover:border-muted/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  What do you sell?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="We create premium sustainable streetwear for men and women, focusing on organic materials and ethical production..."
                  rows={3}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-muted/40 transition-all"
                />
                <p className={`text-xs mt-1.5 text-right ${description.length >= 450 ? "text-warning" : "text-muted/50"}`}>
                  {description.length}/500
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  Monthly revenue <span className="font-normal text-muted/60">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REVENUE_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setMonthlyRevenue(monthlyRevenue === range.id ? "" : range.id)}
                      className={`px-4 py-2.5 rounded-full text-xs font-medium border transition-all duration-150 active:scale-[0.96] ${
                        monthlyRevenue === range.id
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted hover:text-text hover:border-muted/50"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  Social presence <span className="font-normal text-muted/60">(optional)</span>
                </label>
                <div className="space-y-3">
                  <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
                    <span className="px-3 text-muted">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@yourbrand"
                      className="flex-1 bg-transparent px-0 py-3 text-sm text-text focus:outline-none placeholder:text-muted/40"
                    />
                  </div>
                  <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
                    <span className="px-3 text-muted">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourbrand.com"
                      className="flex-1 bg-transparent px-0 py-3 text-sm text-text focus:outline-none placeholder:text-muted/40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => goBack(1)}
                  className="flex-1 py-3.5 bg-surface border border-border text-text text-sm font-semibold rounded-xl hover:bg-card transition-all duration-200 active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  onClick={() => goForward(3)}
                  disabled={!canProceed()}
                  className="flex-1 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-all duration-200 active:scale-[0.98]"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary card */}
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* Store header preview */}
                <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-3 text-accent font-bold text-xl">
                    {storeName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-lg font-display font-bold text-text tracking-wide">{storeName}</p>
                  <p className="text-xs text-muted mt-1">
                    {CATEGORIES.find((c) => c.id === category)?.label}
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Platform */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted">
                        {STORE_TYPES.find((t) => t.id === storeType)?.icon && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted">Platform</p>
                        <p className="text-sm font-medium text-text">{STORE_TYPES.find((t) => t.id === storeType)?.label}</p>
                      </div>
                    </div>
                    <button onClick={() => goBack(1)} className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">
                      Edit
                    </button>
                  </div>

                  {storeUrl && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted">Store URL</p>
                        <p className="text-sm text-text truncate max-w-[240px]">{storeUrl}</p>
                      </div>
                      <button onClick={() => goBack(0)} className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">
                        Edit
                      </button>
                    </div>
                  )}

                  <div className="h-px bg-border" />

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted">About</p>
                      <button onClick={() => goBack(2)} className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-text leading-relaxed">{description}</p>
                  </div>

                  {monthlyRevenue && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted">Revenue</p>
                          <p className="text-sm font-medium text-text">{REVENUE_RANGES.find((r) => r.id === monthlyRevenue)?.label}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* What you get */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-text uppercase tracking-wider mb-4">What you get</p>
                <div className="space-y-3">
                  {[
                    { icon: "💰", text: "Keep 85% of every sale" },
                    { icon: "🎥", text: "Creators promote your products in videos" },
                    { icon: "🏪", text: "Your own branded storefront on Scrollr" },
                    { icon: "📊", text: "Real-time analytics and order management" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <p className="text-sm text-muted">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => goBack(2)}
                  className="flex-1 py-3.5 bg-surface border border-border text-text text-sm font-semibold rounded-xl hover:bg-card transition-all duration-200 active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-accent/90 transition-all duration-200 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>

              <p className="text-center text-[11px] text-muted/60">
                By submitting, you agree to Scrollr&apos;s merchant terms and platform policies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
