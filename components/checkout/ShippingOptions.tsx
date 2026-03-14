"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { ShippingAddress } from "./AddressForm";

export type ShippingOption = {
  name: string;
  price: number;
  minDays: number | null;
  maxDays: number | null;
};

interface ShippingOptionsProps {
  address: ShippingAddress;
  onSelect: (option: ShippingOption) => void;
  onBack: () => void;
  loading?: boolean;
}

export function ShippingOptions({
  address,
  onSelect,
  onBack,
  loading: externalLoading,
}: ShippingOptionsProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch("/api/checkout/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch shipping rates");
        }
        const data = await res.json();
        if (!cancelled) {
          setOptions(data.rates ?? []);
          // Auto-select cheapest if available
          if (data.rates?.length) {
            setSelected(0);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch rates");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    fetchRates();
    return () => {
      cancelled = true;
    };
  }, [address]);

  function deliveryEstimate(opt: ShippingOption): string {
    if (opt.minDays != null && opt.maxDays != null) {
      if (opt.minDays === opt.maxDays) return `${opt.minDays} business days`;
      return `${opt.minDays}-${opt.maxDays} business days`;
    }
    if (opt.minDays != null) return `${opt.minDays}+ business days`;
    if (opt.maxDays != null) return `Up to ${opt.maxDays} business days`;
    return "Estimated at checkout";
  }

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" className="text-accent mb-3" />
        <p className="text-sm text-muted">Calculating shipping rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button variant="secondary" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted mb-4">
          No shipping options are available for this address. Please check your
          address and try again.
        </p>
        <Button variant="secondary" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-display font-bold text-text mb-1">
        Shipping Method
      </h2>

      <div className="space-y-2">
        {options.map((opt, index) => (
          <button
            key={`${opt.name}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
              selected === index
                ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                : "border-border bg-surface hover:border-muted"
            }`}
          >
            {/* Radio indicator */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected === index ? "border-accent" : "border-border"
              }`}
            >
              {selected === index && (
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">{opt.name}</p>
              <p className="text-xs text-muted mt-0.5">
                {deliveryEstimate(opt)}
              </p>
            </div>

            <span className="text-sm font-semibold text-text shrink-0">
              {opt.price === 0
                ? "Free"
                : `$${opt.price.toFixed(2)}`}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack} className="rounded-xl">
          Back
        </Button>
        <Button
          size="lg"
          loading={externalLoading}
          disabled={selected === null}
          onClick={() => selected !== null && onSelect(options[selected])}
          className="flex-1 rounded-xl"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
