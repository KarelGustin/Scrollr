"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

export default function MerchantOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    }>
      <MerchantOnboardingContent />
    </Suspense>
  );
}

function MerchantOnboardingContent() {
  const router = useRouter();
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [error, setError] = useState("");

  const handleConnectShopify = () => {
    const domain = shopifyDomain.trim();
    if (!domain) {
      setError("Please enter your Shopify domain");
      return;
    }
    const fullDomain = domain.endsWith(".myshopify.com")
      ? domain
      : `${domain}.myshopify.com`;
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(fullDomain)}&returnTo=/merchant`;
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <h1 className="text-3xl font-display font-bold text-text tracking-tight mb-2">
          Scrollr
        </h1>
        <p className="text-lg font-display font-semibold text-muted mb-8">
          For Merchants
        </p>

        {/* Value proposition */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 text-left">
          <h2 className="text-xl font-display font-bold text-text mb-4">
            Sell through video discovery
          </h2>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Products synced automatically from your Shopify store</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Upload video content and tag your own products</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Orders fulfilled through your existing Shopify workflow</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>85% revenue share — 15% platform fee, you keep the rest</span>
            </li>
          </ul>
        </div>

        {/* Connect CTA */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50 mb-4">
            <input
              type="text"
              value={shopifyDomain}
              onChange={(e) => {
                setShopifyDomain(e.target.value);
                setError("");
              }}
              placeholder="mystore"
              className="flex-1 bg-transparent px-3 py-3 text-sm text-text focus:outline-none"
            />
            <span className="px-3 text-sm text-muted">.myshopify.com</span>
          </div>
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          <button
            onClick={handleConnectShopify}
            className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Connect your Shopify Store
          </button>
        </div>
      </div>
    </div>
  );
}
