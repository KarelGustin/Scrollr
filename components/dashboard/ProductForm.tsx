"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ProductFormProps {
  onSubmit: (data: {
    name: string;
    brand?: string;
    price?: string;
    affiliateUrl: string;
    description?: string;
    imageUrl?: string;
  }) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export function ProductForm({ onSubmit, loading, submitLabel = "Add Product" }: ProductFormProps) {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    affiliateUrl: "",
    description: "",
    imageUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.affiliateUrl.trim()) {
      newErrors.affiliateUrl = "Affiliate URL is required";
    } else {
      try {
        new URL(form.affiliateUrl);
      } catch {
        newErrors.affiliateUrl = "Must be a valid URL";
      }
    }
    if (form.description.length > 200) {
      newErrors.description = "Description must be 200 characters or less";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      price: form.price.trim() || undefined,
      affiliateUrl: form.affiliateUrl.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
    });

    setForm({ name: "", brand: "", price: "", affiliateUrl: "", description: "", imageUrl: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product Name"
        placeholder="e.g. Summer Glow Palette"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
        required
      />
      <Input
        label="Brand"
        placeholder="e.g. Glossier"
        value={form.brand}
        onChange={(e) => setForm({ ...form, brand: e.target.value })}
      />
      <Input
        label="Price"
        placeholder="e.g. €29.99"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />
      <Input
        label="Affiliate URL"
        placeholder="https://..."
        value={form.affiliateUrl}
        onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
        error={errors.affiliateUrl}
        required
      />
      <Input
        label="Image URL"
        placeholder="https://... (optional)"
        value={form.imageUrl}
        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted">
          Description{" "}
          <span className="text-xs">({form.description.length}/200)</span>
        </label>
        <textarea
          className="w-full px-3 py-2 bg-surface border border-border rounded-[var(--radius)] text-text placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 transition-all duration-200 ease-out resize-none"
          rows={3}
          placeholder="Short description of the product..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={200}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
