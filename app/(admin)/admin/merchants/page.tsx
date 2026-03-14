"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";

interface MerchantProduct {
  id: string;
  shopifyProductId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  productType: string | null;
  vendor: string | null;
  tags: string | null;
  inventoryQuantity: number | null;
  available: boolean;
  createdAt: string;
}

interface Merchant {
  id: string;
  shopifyDomain: string;
  storeName: string | null;
  storeLogoUrl: string | null;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  active: boolean;
  createdAt: string;
  user: { email: string; name: string | null };
  _count: { merchantProducts: number; orders: number };
  totalRevenue: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const inputClass =
  "w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50";
const textareaClass =
  "w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50 resize-y min-h-[80px]";
const btnPrimary =
  "px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors";
const btnSecondary =
  "px-4 py-2 text-sm text-muted hover:text-text transition-colors";
const btnDanger =
  "px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-lg hover:bg-destructive/20 transition-colors";

// ─── Product Row ────────────────────────────────────────────────────────────────

function ProductRow({
  product,
  merchantId,
}: {
  product: MerchantProduct;
  merchantId: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: product.title,
    description: product.description || "",
    imageUrl: product.imageUrl || "",
    price: String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    productType: product.productType || "",
    vendor: product.vendor || "",
    tags: product.tags || "",
    inventoryQuantity: product.inventoryQuantity != null ? String(product.inventoryQuantity) : "",
    available: product.available,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/merchants/${merchantId}/products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, ...form }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-products", merchantId] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/admin/merchants/${merchantId}/products?productId=${product.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-products", merchantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
    },
  });

  if (editing) {
    return (
      <div className="px-4 py-3 bg-surface/50 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Image URL</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Price</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Compare At Price</label>
            <input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Product Type</label>
            <input value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Vendor</label>
            <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Tags</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Inventory</label>
            <input type="number" value={form.inventoryQuantity} onChange={(e) => setForm({ ...form, inventoryQuantity: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaClass} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-accent" />
          <span className="text-sm text-text">Available</span>
        </label>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className={btnSecondary}>Cancel</button>
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className={btnPrimary}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 flex items-center gap-4 hover:bg-surface/30 transition-colors">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.title} className="w-10 h-10 rounded-lg object-cover bg-surface" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-xs text-muted">N/A</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text font-medium truncate">{product.title}</p>
        <p className="text-xs text-muted">
          {product.productType || "No type"} &middot; Inv: {product.inventoryQuantity ?? "N/A"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm text-text font-medium tabular-nums">{fmt(product.price)}</p>
        {product.compareAtPrice && (
          <p className="text-xs text-muted line-through tabular-nums">{fmt(product.compareAtPrice)}</p>
        )}
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
        product.available ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}>
        {product.available ? "Available" : "Unavailable"}
      </span>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)} className="px-2 py-1 text-xs text-accent hover:underline">Edit</button>
        <button
          onClick={() => {
            if (confirm("Delete this product?")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
          className={btnDanger}
        >
          {deleteMutation.isPending ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── Add Product Form ───────────────────────────────────────────────────────────

function AddProductForm({ merchantId, onClose }: { merchantId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    price: "",
    compareAtPrice: "",
    productType: "",
    vendor: "",
    tags: "",
    inventoryQuantity: "",
    available: true,
    sizes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/merchants/${merchantId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-products", merchantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      onClose();
    },
  });

  return (
    <div className="bg-surface/50 rounded-xl p-4 space-y-3 mt-3">
      <h4 className="text-sm font-medium text-text">Add Product</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Product name" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Image URL</label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={inputClass} placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Price *</label>
          <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="29.99" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Compare At Price</label>
          <input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className={inputClass} placeholder="39.99" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Product Type</label>
          <input value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className={inputClass} placeholder="fashion" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Vendor</label>
          <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className={inputClass} placeholder="Brand name" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Tags</label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputClass} placeholder="fashion, trending" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Inventory</label>
          <input type="number" value={form.inventoryQuantity} onChange={(e) => setForm({ ...form, inventoryQuantity: e.target.value })} className={inputClass} placeholder="100" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted block mb-1">Sizes (comma-separated)</label>
          <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={inputClass} placeholder="S, M, L, XL" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted block mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaClass} placeholder="Product description..." />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-accent" />
        <span className="text-sm text-text">Available</span>
      </label>
      <div className="flex gap-2">
        <button onClick={onClose} className={btnSecondary}>Cancel</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.title || !form.price}
          className={btnPrimary}
        >
          {mutation.isPending ? "Adding..." : "Add Product"}
        </button>
      </div>
      {mutation.isError && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}
    </div>
  );
}

// ─── Merchant Products Panel ────────────────────────────────────────────────────

function MerchantProductsPanel({ merchantId }: { merchantId: string }) {
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery<{ products: MerchantProduct[] }>({
    queryKey: ["merchant-products", merchantId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/merchants/${merchantId}/products`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const queryClient = useQueryClient();
  const dummyProductsMutation = useMutation({
    mutationFn: async () => {
      // Generate 8 sample products
      const samples = [
        { title: "Sample Tee", price: "24.99", productType: "fashion", tags: "sample" },
        { title: "Sample Hoodie", price: "49.99", compareAtPrice: "64.99", productType: "fashion", tags: "sample" },
        { title: "Sample Pants", price: "39.99", productType: "fashion", tags: "sample" },
        { title: "Sample Jacket", price: "74.99", compareAtPrice: "99.99", productType: "fashion", tags: "sample" },
        { title: "Sample Accessory", price: "14.99", productType: "accessories", tags: "sample" },
        { title: "Sample Bag", price: "34.99", productType: "accessories", tags: "sample" },
        { title: "Sample Hat", price: "19.99", compareAtPrice: "24.99", productType: "fashion", tags: "sample" },
        { title: "Sample Shoes", price: "59.99", productType: "footwear", tags: "sample" },
      ];
      for (const s of samples) {
        const encodedName = encodeURIComponent(s.title);
        await fetch(`/api/admin/merchants/${merchantId}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...s,
            imageUrl: `https://placehold.co/400x400/1a1a2e/ffffff?text=${encodedName}`,
            inventoryQuantity: String(10 + Math.floor(Math.random() * 190)),
            available: true,
            vendor: "Sample Store",
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-products", merchantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
    },
  });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text">Products ({data?.products.length ?? 0})</h4>
        <div className="flex gap-2">
          <button
            onClick={() => dummyProductsMutation.mutate()}
            disabled={dummyProductsMutation.isPending}
            className="px-3 py-1.5 bg-surface border border-border text-xs font-medium text-muted rounded-lg hover:text-text transition-colors"
          >
            {dummyProductsMutation.isPending ? "Generating..." : "Generate Dummy Products"}
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 bg-accent text-accent-fg text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            Add Product
          </button>
        </div>
      </div>

      {showAdd && <AddProductForm merchantId={merchantId} onClose={() => setShowAdd(false)} />}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" className="text-accent" />
        </div>
      ) : !data?.products.length ? (
        <p className="text-xs text-muted text-center py-6">No products yet. Add one or generate dummy products.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {data.products.map((p) => (
            <ProductRow key={p.id} product={p} merchantId={merchantId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Expanded Merchant Detail ───────────────────────────────────────────────────

function MerchantDetail({ merchant }: { merchant: Merchant }) {
  const queryClient = useQueryClient();
  const [showProducts, setShowProducts] = useState(false);
  const [editForm, setEditForm] = useState({
    storeName: merchant.storeName || "",
    storeLogoUrl: merchant.storeLogoUrl || "",
    shippingPolicy: merchant.shippingPolicy || "",
    returnPolicy: merchant.returnPolicy || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId: merchant.id, ...data }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
    },
  });

  const toggleActive = () => {
    updateMutation.mutate({ active: !merchant.active });
  };

  const saveDetails = () => {
    updateMutation.mutate(editForm);
  };

  return (
    <div className="px-5 pb-5 space-y-5 border-t border-border bg-surface/20">
      {/* Merchant info edit */}
      <div className="pt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted block mb-1">Store Name</label>
          <input
            value={editForm.storeName}
            onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Store Logo URL</label>
          <input
            value={editForm.storeLogoUrl}
            onChange={(e) => setEditForm({ ...editForm, storeLogoUrl: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Shipping Policy</label>
          <textarea
            value={editForm.shippingPolicy}
            onChange={(e) => setEditForm({ ...editForm, shippingPolicy: e.target.value })}
            className={textareaClass}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Return Policy</label>
          <textarea
            value={editForm.returnPolicy}
            onChange={(e) => setEditForm({ ...editForm, returnPolicy: e.target.value })}
            className={textareaClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={saveDetails} disabled={updateMutation.isPending} className={btnPrimary}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={toggleActive}
          disabled={updateMutation.isPending}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            merchant.active
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-success/10 text-success hover:bg-success/20"
          }`}
        >
          {merchant.active ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => setShowProducts(!showProducts)}
          className="px-4 py-2 bg-surface border border-border text-sm font-medium text-text rounded-xl hover:bg-surface/80 transition-colors"
        >
          {showProducts ? "Hide Products" : "Manage Products"}
        </button>
        <a
          href={`/store/${merchant.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-surface border border-border text-sm font-medium text-accent rounded-xl hover:bg-surface/80 transition-colors"
        >
          View Store
        </a>
      </div>

      {updateMutation.isError && (
        <p className="text-sm text-destructive">{(updateMutation.error as Error).message}</p>
      )}

      {showProducts && <MerchantProductsPanel merchantId={merchant.id} />}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    userId: "",
    shopifyDomain: "",
    shopifyAccessToken: "",
    storeName: "",
    storeLogoUrl: "",
    shippingPolicy: "",
    returnPolicy: "",
  });

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
      setForm({
        userId: "",
        shopifyDomain: "",
        shopifyAccessToken: "",
        storeName: "",
        storeLogoUrl: "",
        shippingPolicy: "",
        returnPolicy: "",
      });
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
          className={btnPrimary}
        >
          Add Merchant
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-4">
          <h3 className="text-sm font-medium text-text">New Merchant</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1">User ID (optional - auto-creates if empty)</label>
              <input
                placeholder="Leave blank to auto-create user"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Store Name *</label>
              <input
                placeholder="My Store"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Shopify Domain *</label>
              <input
                placeholder="mystore.myshopify.com"
                value={form.shopifyDomain}
                onChange={(e) => setForm({ ...form, shopifyDomain: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Shopify Access Token (optional)</label>
              <input
                placeholder="Auto-generated if empty"
                value={form.shopifyAccessToken}
                onChange={(e) => setForm({ ...form, shopifyAccessToken: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Store Logo URL</label>
              <input
                placeholder="https://..."
                value={form.storeLogoUrl}
                onChange={(e) => setForm({ ...form, storeLogoUrl: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>{/* spacer */}</div>
            <div>
              <label className="text-xs text-muted block mb-1">Shipping Policy</label>
              <textarea
                placeholder="Free shipping on orders over $50..."
                value={form.shippingPolicy}
                onChange={(e) => setForm({ ...form, shippingPolicy: e.target.value })}
                className={textareaClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Return Policy</label>
              <textarea
                placeholder="30-day returns..."
                value={form.returnPolicy}
                onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                className={textareaClass}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className={btnSecondary}>Cancel</button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !form.shopifyDomain}
              className={btnPrimary}
            >
              {addMutation.isPending ? "Adding..." : "Add Merchant"}
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
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td colSpan={6} className="p-0">
                      <div
                        onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                        className="cursor-pointer hover:bg-surface/50 transition-colors"
                      >
                        <div className="flex">
                          <div className="flex-1 px-5 py-3 flex items-center gap-3">
                            {m.storeLogoUrl ? (
                              <img src={m.storeLogoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-xs text-muted font-bold">
                                {(m.storeName || "?")[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-text font-medium">{m.storeName || "Unnamed"}</p>
                              <p className="text-xs text-muted">{m.user.email}</p>
                            </div>
                          </div>
                          <div className="px-5 py-3 text-sm text-muted self-center">{m.shopifyDomain}</div>
                          <div className="px-5 py-3 text-sm text-text text-right tabular-nums self-center">{m._count.merchantProducts}</div>
                          <div className="px-5 py-3 text-sm text-text text-right tabular-nums self-center">{m._count.orders}</div>
                          <div className="px-5 py-3 text-sm text-text text-right tabular-nums font-medium self-center">{fmt(m.totalRevenue)}</div>
                          <div className="px-5 py-3 text-center self-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              m.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            }`}>
                              {m.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {expandedId === m.id && <MerchantDetail merchant={m} />}
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
