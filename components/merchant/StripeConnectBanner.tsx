"use client";

import { useState } from "react";

export function StripeConnectBanner() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFF0E0] border border-[#FDDCB5] rounded-xl p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FDE68A] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#92400e]">Connect Stripe to receive payouts</p>
          <p className="text-xs text-[#b45309] mt-0.5">Your store is live but you can&apos;t receive payments yet</p>
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {loading ? "Loading..." : "Connect Stripe"}
      </button>
    </div>
  );
}
