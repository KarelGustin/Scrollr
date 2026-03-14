"use client";

import { useEffect, useState } from "react";

export default function MerchantSettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/merchant/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.merchant) {
          setStoreName(data.merchant.storeName ?? "");
          setStoreLogoUrl(data.merchant.storeLogoUrl ?? "");
          setShippingPolicy(data.merchant.shippingPolicy ?? "");
          setReturnPolicy(data.merchant.returnPolicy ?? "");
          setShopifyDomain(data.merchant.shopifyDomain ?? "");
          setActive(data.merchant.active ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/merchant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, storeLogoUrl, shippingPolicy, returnPolicy, active }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-text">Settings</h1>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-text">Settings</h1>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="text-sm font-display font-bold text-text">Store Details</h3>

        <div>
          <label className="text-xs text-muted block mb-1.5">Store Name</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Logo URL</label>
          <input
            type="url"
            value={storeLogoUrl}
            onChange={(e) => setStoreLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Shipping Policy</label>
          <textarea
            value={shippingPolicy}
            onChange={(e) => setShippingPolicy(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text resize-none focus:outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Return Policy</label>
          <textarea
            value={returnPolicy}
            onChange={(e) => setReturnPolicy(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text resize-none focus:outline-none focus:border-accent/50"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-text">Store Active</p>
            <p className="text-xs text-muted">Your products will be visible when active</p>
          </div>
          <button
            onClick={() => setActive(!active)}
            className={`w-12 h-7 rounded-full transition-colors ${active ? "bg-success" : "bg-surface border border-border"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-display font-bold text-text mb-3">Shopify Connection</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${shopifyDomain ? "bg-success" : "bg-muted"}`} />
          <p className="text-sm text-muted">
            {shopifyDomain ? `Connected: ${shopifyDomain}` : "Not connected"}
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors touch-target"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
