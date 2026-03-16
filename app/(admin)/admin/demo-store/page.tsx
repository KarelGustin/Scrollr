"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";
import Link from "next/link";

interface DemoStoreResult {
  success: boolean;
  merchant: { id: string; slug: string; storeName: string };
  productsCreated: number;
  storeUrl: string;
}

export default function DemoStorePage() {
  const queryClient = useQueryClient();
  const [storeName, setStoreName] = useState("Demo Brand Store");
  const [slug, setSlug] = useState("demo-brand-store");
  const [result, setResult] = useState<DemoStoreResult | null>(null);

  // Check if demo store exists
  const { data: merchants } = useQuery<{ merchants: { id: string; slug: string | null; storeName: string | null }[] }>({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const res = await fetch("/api/admin/merchants");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const demoStore = merchants?.merchants.find((m) => m.slug === slug);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/demo-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create demo store");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/demo-store?slug=${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete demo store");
      return res.json();
    },
    onSuccess: () => {
      setResult(null);
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Demo Store</h1>
        <p className="text-sm text-muted mt-1">
          Create a demo brand store with 20 sample products to preview the storefront experience
        </p>
      </div>

      {/* Store Config */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-medium text-text mb-4">Store Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs text-muted block mb-1">Store Name</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Store Slug (URL)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <p className="text-xs text-muted mt-1">URL: /store/{slug}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {demoStore ? (
            <>
              <Link
                href={`/store/${slug}`}
                target="_blank"
                className="px-4 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
              >
                View Storefront
              </Link>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-4 py-2.5 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Demo Store"}
              </button>
            </>
          ) : (
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !storeName || !slug}
              className="px-4 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="text-accent-fg" />
                  Creating Store & 20 Products...
                </span>
              ) : (
                "Create Demo Store with 20 Products"
              )}
            </button>
          )}
        </div>

        {createMutation.isError && (
          <p className="text-sm text-destructive mt-3">{(createMutation.error as Error).message}</p>
        )}
        {deleteMutation.isError && (
          <p className="text-sm text-destructive mt-3">{(deleteMutation.error as Error).message}</p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-success mb-2">Demo Store Created</h3>
          <div className="space-y-1 text-sm text-text">
            <p>Store: <span className="font-medium">{result.merchant.storeName}</span></p>
            <p>Products Created: <span className="font-medium">{result.productsCreated}</span></p>
            <p>
              Store URL:{" "}
              <Link href={result.storeUrl} target="_blank" className="text-accent hover:underline font-medium">
                {result.storeUrl}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* What gets created */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-sm font-medium text-text mb-4">What gets created</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-card rounded-lg">
            <p className="text-2xl font-bold text-accent">1</p>
            <p className="text-xs text-muted mt-1">Merchant Account</p>
          </div>
          <div className="p-4 bg-card rounded-lg">
            <p className="text-2xl font-bold text-accent">20</p>
            <p className="text-xs text-muted mt-1">Demo Products</p>
          </div>
          <div className="p-4 bg-card rounded-lg">
            <p className="text-2xl font-bold text-accent">1</p>
            <p className="text-xs text-muted mt-1">Storefront Page</p>
          </div>
          <div className="p-4 bg-card rounded-lg">
            <p className="text-2xl font-bold text-accent">6</p>
            <p className="text-xs text-muted mt-1">Product Categories</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Product Categories</h3>
          <div className="flex flex-wrap gap-2">
            {["T-Shirts", "Outerwear", "Hoodies", "Pants", "Accessories", "Footwear", "Shirts", "Shorts"].map((cat) => (
              <span key={cat} className="px-2.5 py-1 bg-card text-xs text-muted rounded-lg">{cat}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
