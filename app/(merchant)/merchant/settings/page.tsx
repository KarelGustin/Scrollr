"use client";

import { useEffect, useState } from "react";

export default function MerchantSettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [shopifyConnectDomain, setShopifyConnectDomain] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number } | null>(null);
  const [syncError, setSyncError] = useState("");
  const [productCount, setProductCount] = useState<number | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

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

    // Fetch product count
    fetch("/api/merchant-products?limit=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.pagination) setProductCount(data.pagination.total);
      })
      .catch(() => {});
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

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError("");
    try {
      const res = await fetch("/api/merchant/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setSyncError(data.error || "Sync failed");
        return;
      }
      const result = await res.json();
      setSyncResult(result);
      // Refresh product count
      fetch("/api/merchant-products?limit=1")
        .then((r) => r.json())
        .then((data) => {
          if (data.pagination) setProductCount(data.pagination.total);
        })
        .catch(() => {});
    } catch {
      setSyncError("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/merchant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disconnectShopify: true }),
      });
      setShopifyDomain("");
      setShowDisconnectConfirm(false);
    } catch { /* ignore */ }
    setDisconnecting(false);
  };

  const handleConnectShopify = () => {
    const domain = shopifyConnectDomain.trim();
    if (!domain) return;
    const fullDomain = domain.endsWith(".myshopify.com")
      ? domain
      : `${domain}.myshopify.com`;
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(fullDomain)}&returnTo=/merchant/settings`;
  };

  const isShopifyConnected = shopifyDomain && shopifyDomain.endsWith(".myshopify.com");

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

      {/* Shopify Connection */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-display font-bold text-text mb-4">Shopify Connection</h3>

        {isShopifyConnected ? (
          <div className="space-y-4">
            {/* Connected state */}
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <div>
                <p className="text-sm font-medium text-text">{shopifyDomain}</p>
                {productCount !== null && (
                  <p className="text-xs text-muted">{productCount} products synced</p>
                )}
              </div>
            </div>

            {/* Sync result */}
            {syncResult && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-sm text-green-500">
                  Sync complete: {syncResult.created} created, {syncResult.updated} updated
                </p>
              </div>
            )}

            {syncError && (
              <p className="text-sm text-destructive">{syncError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
              >
                {syncing ? "Syncing..." : "Re-sync Products"}
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="px-4 py-2.5 bg-surface border border-border text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/10 transition-colors"
              >
                Disconnect
              </button>
            </div>

            {/* Disconnect confirmation */}
            {showDisconnectConfirm && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
                <p className="text-sm text-text">
                  Are you sure? This will remove the Shopify connection. Your synced products will remain but won&apos;t receive updates.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="flex-1 py-2 bg-surface border border-border text-text text-sm font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex-1 py-2 bg-destructive text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                  >
                    {disconnecting ? "Disconnecting..." : "Yes, Disconnect"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Disconnected state */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <p className="text-sm text-muted">Not connected</p>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">Shopify Domain</label>
              <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent/50">
                <input
                  type="text"
                  value={shopifyConnectDomain}
                  onChange={(e) => setShopifyConnectDomain(e.target.value)}
                  placeholder="mystore"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text focus:outline-none"
                />
                <span className="px-3 text-sm text-muted">.myshopify.com</span>
              </div>
            </div>
            <button
              onClick={handleConnectShopify}
              disabled={!shopifyConnectDomain.trim()}
              className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              Connect Shopify
            </button>
          </div>
        )}
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
