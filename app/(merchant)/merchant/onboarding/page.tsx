"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: "store", title: "Set up your store", subtitle: "Brand your storefront" },
  { id: "shipping", title: "Shipping & returns", subtitle: "Configure delivery options" },
  { id: "products", title: "Add your products", subtitle: "Import your catalog" },
  { id: "payments", title: "Get paid", subtitle: "Connect your bank account" },
];

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store setup
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Shipping
  const [shippingRateStandard, setShippingRateStandard] = useState("");
  const [shippingRateExpress, setShippingRateExpress] = useState("");
  const [shippingDaysMin, setShippingDaysMin] = useState("3");
  const [shippingDaysMax, setShippingDaysMax] = useState("7");
  const [returnPolicy, setReturnPolicy] = useState("14");

  // Products
  const [storeType, setStoreType] = useState<string | null>(null);
  const [stripeOnboarded, setStripeOnboarded] = useState(false);

  // Load existing merchant data
  useEffect(() => {
    fetch("/api/merchant/settings")
      .then((r) => r.json())
      .then((data) => {
        const m = data.merchant;
        if (m) {
          setStoreName(m.storeName || "");
          setStoreDescription(m.storeDescription || "");
          setSlug(m.slug || "");
          setLogoPreview(m.storeLogoUrl || null);
          setStoreType(m.storeType || null);
          setStripeOnboarded(m.stripeConnectOnboarded || false);
          if (m.shippingRateStandard) setShippingRateStandard(String(m.shippingRateStandard));
          if (m.shippingRateExpress) setShippingRateExpress(String(m.shippingRateExpress));
          if (m.shippingDaysMin) setShippingDaysMin(String(m.shippingDaysMin));
          if (m.shippingDaysMax) setShippingDaysMax(String(m.shippingDaysMax));
          if (m.returnPolicy) setReturnPolicy(m.returnPolicy);
        }
      })
      .catch(() => {});
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStore = async () => {
    setSaving(true);
    setError("");
    try {
      // Save store settings
      const res = await fetch("/api/merchant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: storeName.trim(),
          storeLogoUrl: logoPreview,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");

      // Save storefront settings
      const storeRes = await fetch("/api/merchant/storefront", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim() || generateSlug(storeName),
          storeDescription: storeDescription.trim(),
        }),
      });
      if (!storeRes.ok) throw new Error("Failed to save storefront");

      setStep(1);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShipping = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/merchant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingRateStandard: shippingRateStandard ? parseFloat(shippingRateStandard) : null,
          shippingRateExpress: shippingRateExpress ? parseFloat(shippingRateExpress) : null,
          shippingDaysMin: shippingDaysMin ? parseInt(shippingDaysMin) : null,
          shippingDaysMax: shippingDaysMax ? parseInt(shippingDaysMax) : null,
          returnPolicy: returnPolicy ? `${returnPolicy}-day return policy` : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setStep(2);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Top bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-sm font-display font-bold text-text">Store Setup</h1>
          <button
            onClick={() => router.push("/merchant")}
            className="text-xs text-muted hover:text-text transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress steps */}
        <div className="flex items-center gap-4 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < step
                    ? "bg-accent text-white"
                    : i === step
                    ? "bg-accent/15 text-accent border-2 border-accent"
                    : "bg-surface text-muted border border-border"
                }`}>
                  {i < step ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                    i < step ? "bg-accent" : "bg-border"
                  }`} />
                )}
              </div>
              <p className={`text-[11px] font-medium transition-colors hidden sm:block ${
                i <= step ? "text-text" : "text-muted"
              }`}>{s.title}</p>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div key={step} className="animate-[fadeUp_0.4s_ease-out]">
          <h2 className="text-2xl font-display font-bold text-text mb-1">{STEPS[step].title}</h2>
          <p className="text-sm text-muted mb-8">{STEPS[step].subtitle}</p>

          {/* Step 0: Store branding */}
          {step === 0 && (
            <div className="space-y-6">
              {/* Logo upload */}
              <div className="flex items-center gap-5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 bg-surface flex items-center justify-center overflow-hidden transition-all group"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted group-hover:text-accent transition-colors">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-text">Store logo</p>
                  <p className="text-xs text-muted">Square image, at least 200x200px</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Store name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    if (!slug || slug === generateSlug(storeName)) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="Your Brand Name"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-text text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-muted/40 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Store URL</label>
                <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
                  <span className="px-4 text-xs text-muted bg-card border-r border-border py-3.5">scrollr.io/store/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))}
                    placeholder="your-brand"
                    className="flex-1 bg-transparent px-3 py-3.5 text-sm text-text focus:outline-none placeholder:text-muted/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  Description <span className="font-normal text-muted/60">(shown on storefront)</span>
                </label>
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value.slice(0, 300))}
                  placeholder="Premium sustainable fashion for the modern wardrobe."
                  rows={2}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-muted/40 transition-all"
                />
              </div>

              {/* Live preview */}
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Preview</p>
                <div className="bg-[#FAFAF8] rounded-2xl border border-border p-6 text-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="w-12 h-12 rounded-full mx-auto mb-3 object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-[#222] text-white font-bold text-lg">
                      {storeName ? storeName.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <p className="text-base font-bold text-[#1a1a1a] tracking-wide">
                    {storeName ? storeName.toUpperCase() : "YOUR STORE"}
                  </p>
                  {storeDescription && (
                    <p className="text-xs text-[#999] mt-1">{storeDescription}</p>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                onClick={handleSaveStore}
                disabled={saving || !storeName.trim()}
                className="w-full py-3.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-all duration-200 active:scale-[0.98]"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          )}

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Standard shipping</label>
                  <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50 transition-all">
                    <span className="px-3 text-sm text-muted">€</span>
                    <input
                      type="number"
                      value={shippingRateStandard}
                      onChange={(e) => setShippingRateStandard(e.target.value)}
                      placeholder="4.99"
                      step="0.01"
                      min="0"
                      className="flex-1 bg-transparent px-0 py-3.5 text-sm text-text focus:outline-none placeholder:text-muted/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Express shipping</label>
                  <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50 transition-all">
                    <span className="px-3 text-sm text-muted">€</span>
                    <input
                      type="number"
                      value={shippingRateExpress}
                      onChange={(e) => setShippingRateExpress(e.target.value)}
                      placeholder="9.99"
                      step="0.01"
                      min="0"
                      className="flex-1 bg-transparent px-0 py-3.5 text-sm text-text focus:outline-none placeholder:text-muted/40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Min delivery days</label>
                  <input
                    type="number"
                    value={shippingDaysMin}
                    onChange={(e) => setShippingDaysMin(e.target.value)}
                    min="1"
                    max="30"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm text-text focus:outline-none focus:border-accent/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Max delivery days</label>
                  <input
                    type="number"
                    value={shippingDaysMax}
                    onChange={(e) => setShippingDaysMax(e.target.value)}
                    min="1"
                    max="60"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm text-text focus:outline-none focus:border-accent/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Return window</label>
                <div className="flex gap-2">
                  {["14", "30", "60", "none"].map((days) => (
                    <button
                      key={days}
                      onClick={() => setReturnPolicy(days)}
                      className={`flex-1 py-3 rounded-xl text-xs font-medium border transition-all duration-150 ${
                        returnPolicy === days
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted hover:border-muted/50"
                      }`}
                    >
                      {days === "none" ? "No returns" : `${days} days`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-muted leading-relaxed">
                  Shopify merchants: shipping rates are automatically pulled from your store during checkout. These settings are used as fallback for non-Shopify orders.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3.5 bg-surface border border-border text-text text-sm font-semibold rounded-xl hover:bg-card transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveShipping}
                  disabled={saving}
                  className="flex-1 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-all active:scale-[0.98]"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Products */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Shopify sync option */}
              <button
                onClick={() => {
                  if (storeType === "shopify") {
                    router.push("/merchant/settings");
                  } else {
                    setStep(3);
                  }
                }}
                className="w-full bg-surface border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-accent/30 hover:bg-card transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text mb-1">Sync from Shopify</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Connect your Shopify store to automatically sync products, inventory, and orders.
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted mt-1 shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* CSV import — coming soon */}
              <div className="w-full bg-surface border border-border rounded-2xl p-5 flex items-start gap-4 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-text">CSV Import</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Upload your product catalog via spreadsheet. Perfect for stores not on Shopify.
                  </p>
                </div>
              </div>

              {/* WooCommerce — coming soon */}
              <div className="w-full bg-surface border border-border rounded-2xl p-5 flex items-start gap-4 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-text">WooCommerce</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Connect your WooCommerce store to sync products automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 bg-surface border border-border text-text text-sm font-semibold rounded-xl hover:bg-card transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payments */}
          {step === 3 && (
            <div className="space-y-6">
              {stripeOnboarded ? (
                <div className="bg-success/10 border border-success/20 rounded-2xl p-6 text-center animate-[scaleIn_0.4s_ease-out]">
                  <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-text mb-1">Stripe Connected</p>
                  <p className="text-sm text-muted">Your bank account is linked. You&apos;re ready to receive payouts.</p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#635BFF]/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#635BFF" strokeWidth="1.5">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-text mb-1">Connect Stripe</p>
                  <p className="text-sm text-muted mb-5 leading-relaxed">
                    Link your bank account via Stripe to receive your 85% share of every sale. Payouts arrive within 2–3 business days.
                  </p>
                  <button
                    onClick={handleConnectStripe}
                    disabled={saving}
                    className="w-full py-3.5 bg-[#635BFF] text-white text-sm font-semibold rounded-xl hover:bg-[#5a52e6] transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {saving ? "Connecting..." : "Connect with Stripe"}
                  </button>
                </div>
              )}

              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-text mb-2">Revenue split</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">You receive</p>
                    <p className="text-sm font-bold text-accent">85%</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">Platform fee</p>
                    <p className="text-xs text-muted">10%</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">Creator commission</p>
                    <p className="text-xs text-muted">5%</p>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 bg-surface border border-border text-text text-sm font-semibold rounded-xl hover:bg-card transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => router.push("/merchant")}
                  className="flex-1 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all active:scale-[0.98]"
                >
                  {stripeOnboarded ? "Go to Dashboard" : "Skip & Finish Later"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
