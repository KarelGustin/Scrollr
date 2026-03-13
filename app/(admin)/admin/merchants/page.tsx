"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";

interface Merchant {
  id: string;
  shopifyDomain: string;
  storeName: string | null;
  storeLogoUrl: string | null;
  active: boolean;
  createdAt: string;
  user: { email: string; name: string | null };
  _count: { merchantProducts: number; orders: number };
  totalRevenue: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ userId: "", shopifyDomain: "", shopifyAccessToken: "", storeName: "" });

  const { data, isLoading } = useQuery<{ merchants: Merchant[]; total: number }>({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const res = await fetch("/api/admin/merchants");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setShowAdd(false);
      setForm({ userId: "", shopifyDomain: "", shopifyAccessToken: "", storeName: "" });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Merchants</h1>
          <p className="text-sm text-muted mt-1">{data?.total ?? 0} merchants</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
        >
          Add Merchant
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-4">
          <h3 className="text-sm font-medium text-text">New Merchant</h3>
          <input
            placeholder="User ID"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
          <input
            placeholder="Shopify Domain (mystore.myshopify.com)"
            value={form.shopifyDomain}
            onChange={(e) => setForm({ ...form, shopifyDomain: e.target.value })}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
          <input
            placeholder="Shopify Access Token"
            value={form.shopifyAccessToken}
            onChange={(e) => setForm({ ...form, shopifyAccessToken: e.target.value })}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
          <input
            placeholder="Store Name"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-muted hover:text-text transition-colors">Cancel</button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !form.userId || !form.shopifyDomain}
              className="px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              {addMutation.isPending ? "Adding..." : "Add"}
            </button>
          </div>
          {addMutation.isError && <p className="text-sm text-destructive">{(addMutation.error as Error).message}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-accent" />
        </div>
      ) : !data?.merchants.length ? (
        <p className="text-sm text-muted text-center py-20">No merchants yet</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Store</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Domain</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Products</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Orders</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Revenue</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.merchants.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm text-text font-medium">{m.storeName || "Unnamed"}</p>
                      <p className="text-xs text-muted">{m.user.email}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">{m.shopifyDomain}</td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">{m._count.merchantProducts}</td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums">{m._count.orders}</td>
                    <td className="px-5 py-3 text-sm text-text text-right tabular-nums font-medium">{fmt(m.totalRevenue)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        m.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>
                        {m.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
