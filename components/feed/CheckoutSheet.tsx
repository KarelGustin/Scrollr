"use client";

import { useState } from "react";
import type { FeedVideoProduct } from "@/types";
import { formatPrice } from "@/lib/format";

interface CheckoutSheetProps {
  product: FeedVideoProduct;
  selectedSize?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutSheet({
  product,
  selectedSize,
  onClose,
  onSuccess,
}: CheckoutSheetProps) {
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState({
    line1: "",
    city: "",
    zip: "",
    country: "DE",
  });
  const [error, setError] = useState("");

  const shippingCost = 4.99;
  const total = (product.price ?? 0) + shippingCost;

  const handleSubmit = async () => {
    if (!email || !name || !address.line1 || !address.city || !address.zip) {
      setError("Please fill in all required fields");
      return;
    }

    setStep("processing");
    setError("");

    try {
      const res = await fetch("/api/checkout/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantProductId: product.merchantProductId,
          productId: product.id,
          selectedSize,
          email,
          name,
          shippingAddress: address,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Checkout failed");
        setStep("form");
        return;
      }

      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted">Processing your order...</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4" style={{ animation: "confetti-pop 0.5s ease-out" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-bold text-text">Order Confirmed!</h3>
            <p className="text-sm text-muted mt-1">Thank you for your purchase</p>
          </div>
        )}

        {step === "form" && (
          <>
            <h3 className="text-lg font-display font-bold text-text mb-4">Quick Checkout</h3>

            {/* Order summary */}
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-4">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{product.name}</p>
                {selectedSize && (
                  <p className="text-xs text-muted">Size: {selectedSize}</p>
                )}
              </div>
              <p className="text-sm font-bold text-text">
                {product.price != null ? formatPrice(product.price) : "—"}
              </p>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
              />
              <input
                type="text"
                value={address.line1}
                onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                placeholder="Address"
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  placeholder="City"
                  className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                />
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => setAddress((a) => ({ ...a, zip: e.target.value }))}
                  placeholder="Postal code"
                  className="w-28 bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive mt-3">{error}</p>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm text-muted mb-1">
                <span>Subtotal</span>
                <span>{product.price != null ? formatPrice(product.price) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm text-muted mb-2">
                <span>Shipping</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-text">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handleSubmit}
              className="w-full mt-4 py-3 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              Pay {formatPrice(total)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
