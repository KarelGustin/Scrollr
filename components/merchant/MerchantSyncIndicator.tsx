"use client";

import { useState, useEffect } from "react";

interface MerchantSyncIndicatorProps {
  initialStatus: string;
}

export default function MerchantSyncIndicator({ initialStatus }: MerchantSyncIndicatorProps) {
  const [status, setStatus] = useState(initialStatus);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (status !== "SYNCING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/merchant/sync-status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data.syncStatus);
          setProductCount(data.productCount);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  if (status === "COMPLETE") return null;

  if (status === "FAILED") {
    return (
      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-red-500">Product sync failed</p>
          <p className="text-xs text-muted">Try reconnecting your Shopify store</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-accent">Syncing your products...</p>
        <p className="text-xs text-muted">
          {productCount > 0 ? `${productCount} products synced so far` : "This may take a minute"}
        </p>
      </div>
    </div>
  );
}
