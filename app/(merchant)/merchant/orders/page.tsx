"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  merchantProduct: {
    id: string;
    title: string;
    imageUrl: string | null;
    price: number;
    sku: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-500",
  PAID: "bg-blue-500/20 text-blue-500",
  FULFILLED: "bg-purple-500/20 text-purple-500",
  SHIPPED: "bg-purple-500/20 text-purple-500",
  DELIVERED: "bg-green-500/20 text-green-500",
  CANCELLED: "bg-red-500/20 text-red-500",
  REFUNDED: "bg-red-500/20 text-red-500",
};

const STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/merchant/orders?${params}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleMarkShipped = async (orderId: string) => {
    setUpdatingOrder(orderId);
    try {
      await fetch(`/api/merchant/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SHIPPED",
          trackingNumber: trackingInput || undefined,
        }),
      });
      setTrackingInput("");
      await fetchOrders(pagination.page);
    } catch { /* ignore */ }
    setUpdatingOrder(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-text">Orders</h1>
        <span className="text-sm text-muted">{pagination.total} total</span>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-accent text-accent-fg"
                : "bg-surface text-muted hover:text-text"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-display font-bold text-text mb-1">No orders yet</h2>
            <p className="text-sm text-muted">Share your store link to start selling!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            return (
              <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Order header row */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        #{order.orderNumber.slice(-8)}
                      </p>
                      <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text">${order.total.toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-surface text-muted"}`}>
                      {order.status}
                    </span>
                    <svg
                      className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                    {/* Buyer info */}
                    <div>
                      <p className="text-xs text-muted mb-1">Customer</p>
                      <p className="text-sm text-text">{order.buyerName}</p>
                      <p className="text-xs text-muted">{order.buyerEmail}</p>
                    </div>

                    {/* Shipping address */}
                    <div>
                      <p className="text-xs text-muted mb-1">Shipping Address</p>
                      <p className="text-sm text-text">
                        {order.shippingAddress.line1}
                        {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
                        <br />
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                        <br />
                        {order.shippingAddress.country}
                      </p>
                    </div>

                    {/* Line items */}
                    <div>
                      <p className="text-xs text-muted mb-2">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            {item.merchantProduct.imageUrl && (
                              <img
                                src={item.merchantProduct.imageUrl}
                                alt={item.merchantProduct.title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text truncate">{item.merchantProduct.title}</p>
                              <p className="text-xs text-muted">
                                Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-text">${item.total.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order totals */}
                    <div className="border-t border-border pt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Subtotal</span>
                        <span className="text-text">${order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Shipping</span>
                        <span className="text-text">${order.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-text">Total</span>
                        <span className="text-text">${order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Tracking info */}
                    {order.trackingNumber && (
                      <div>
                        <p className="text-xs text-muted mb-1">Tracking</p>
                        <p className="text-sm text-text">{order.trackingNumber}</p>
                      </div>
                    )}

                    {/* Mark as Shipped action */}
                    {(order.status === "PENDING" || order.status === "PAID") && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="Tracking number (optional)"
                          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
                        />
                        <button
                          onClick={() => handleMarkShipped(order.id)}
                          disabled={updatingOrder === order.id}
                          className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
                        >
                          {updatingOrder === order.id ? "Updating..." : "Mark as Shipped"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 bg-surface text-sm text-muted rounded-xl disabled:opacity-30 hover:text-text transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-muted">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 bg-surface text-sm text-muted rounded-xl disabled:opacity-30 hover:text-text transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
