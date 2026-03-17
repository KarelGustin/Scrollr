"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

export type ShippingAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

interface AddressFormProps {
  onSubmit: (address: ShippingAddress) => void;
  initialAddress?: ShippingAddress;
  loading?: boolean;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const inputClass =
  "w-full bg-card border border-border rounded-md px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-text/20 focus:border-text/30 transition-colors";

export function AddressForm({ onSubmit, initialAddress, loading }: AddressFormProps) {
  const [form, setForm] = useState<ShippingAddress>(
    initialAddress ?? {
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  function update(field: keyof ShippingAddress, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const required: (keyof ShippingAddress)[] = [
      "firstName",
      "lastName",
      "address1",
      "city",
      "state",
      "zip",
      "country",
    ];
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};
    for (const field of required) {
      if (!form[field]?.trim()) {
        newErrors[field] = "Required";
      }
    }
    // Basic zip validation for US
    if (form.country === "US" && form.zip && !/^\d{5}(-\d{4})?$/.test(form.zip.trim())) {
      newErrors.zip = "Enter a valid US zip code";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      address2: form.address2?.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 retail-panel rounded-md p-4 sm:p-5">
      <div>
      <p className="retail-kicker mb-2">Shipping details</p>
      <h2 className="text-[1.85rem] leading-none font-display font-semibold tracking-[-0.03em] text-text">
        Shipping Address
      </h2>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
            First Name
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="First name"
            className={`${inputClass} ${errors.firstName ? "border-destructive" : ""}`}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
            Last Name
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Last name"
            className={`${inputClass} ${errors.lastName ? "border-destructive" : ""}`}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Address 1 */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
          Address
        </label>
        <input
          type="text"
          value={form.address1}
          onChange={(e) => update("address1", e.target.value)}
          placeholder="Street address"
          className={`${inputClass} ${errors.address1 ? "border-destructive" : ""}`}
        />
        {errors.address1 && (
          <p className="text-xs text-destructive mt-1">{errors.address1}</p>
        )}
      </div>

      {/* Address 2 */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
          Apartment / Suite (optional)
        </label>
        <input
          type="text"
          value={form.address2 ?? ""}
          onChange={(e) => update("address2", e.target.value)}
          placeholder="Apt, suite, unit, etc."
          className={inputClass}
        />
      </div>

      {/* City / State / Zip */}
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-3">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
            City
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="City"
            className={`${inputClass} ${errors.city ? "border-destructive" : ""}`}
          />
          {errors.city && (
            <p className="text-xs text-destructive mt-1">{errors.city}</p>
          )}
        </div>
        <div className="col-span-1">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
            State
          </label>
          <select
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className={`${inputClass} ${errors.state ? "border-destructive" : ""}`}
          >
            <option value="">--</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="text-xs text-destructive mt-1">{errors.state}</p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
            Zip Code
          </label>
          <input
            type="text"
            value={form.zip}
            onChange={(e) => update("zip", e.target.value)}
            placeholder="12345"
            className={`${inputClass} ${errors.zip ? "border-destructive" : ""}`}
          />
          {errors.zip && (
            <p className="text-xs text-destructive mt-1">{errors.zip}</p>
          )}
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
          Country
        </label>
        <select
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
          className={`${inputClass} ${errors.country ? "border-destructive" : ""}`}
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
        </select>
        {errors.country && (
          <p className="text-xs text-destructive mt-1">{errors.country}</p>
        )}
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full rounded-md uppercase tracking-[0.14em] text-[11px]">
        Continue to Shipping
      </Button>
    </form>
  );
}
