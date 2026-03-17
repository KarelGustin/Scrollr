"use client";

import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  merchantProduct: {
    title: string;
    imageUrl: string | null;
    price: number;
    currency: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: OrderItem[];
  merchant: { storeName: string | null; storeLogoUrl: string | null };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  PAID: { bg: "bg-accent/10", text: "text-accent", label: "Paid" },
  FULFILLED: { bg: "bg-social/10", text: "text-social", label: "Fulfilled" },
  SHIPPED: { bg: "bg-social/10", text: "text-social", label: "Shipped" },
  DELIVERED: { bg: "bg-success/10", text: "text-success", label: "Delivered" },
  CANCELLED: { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
  REFUNDED: { bg: "bg-muted/10", text: "text-muted", label: "Refunded" },
};

export default function OrdersPage() {
  const { user, status } = useAuth();
  const isAuthenticated = status === "authenticated" && !!user;
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["consumer-orders"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/orders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-3">
          <h1 className="text-lg font-display font-bold text-text">Orders</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {!isAuthenticated ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 className="text-base font-display font-bold text-text mb-1">Track orders after checkout</h2>
            <p className="text-sm text-muted mb-3">
              Guest checkout is supported. Order confirmations and shipping updates are sent to your email.
            </p>
            <p className="text-sm text-muted mb-5">
              Sign in with the same email later if you want your orders listed here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center px-5 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-full hover:bg-accent/90 transition-colors"
              >
                Open Cart
              </Link>
              <Link
                href="/login?callbackUrl=/orders"
                className="inline-flex items-center justify-center px-5 py-2 bg-surface text-text text-sm font-semibold rounded-full hover:bg-surface/80 transition-colors"
              >
                Log In To View Orders
              </Link>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" className="text-accent" />
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 className="text-base font-display font-bold text-text mb-1">No orders yet</h2>
            <p className="text-sm text-muted mb-5">Your order history will appear here.</p>
            <Link
              href="/discover"
              className="inline-flex items-center px-5 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-full hover:bg-accent/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
              const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency });

              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border p-4">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">#{order.orderNumber.slice(-8)}</span>
                      <span className="text-xs text-muted">&middot;</span>
                      <span className="text-xs text-muted">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="w-10 h-10 rounded-xl bg-surface border border-border overflow-hidden"
                        >
                          {item.merchantProduct.imageUrl ? (
                            <img
                              src={item.merchantProduct.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                              ?
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-xs text-muted">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate">
                        {order.items.map((i) => i.merchantProduct.title).join(", ")}
                      </p>
                      <p className="text-xs text-muted">
                        {order.merchant.storeName || "Store"} &middot; {order.items.length} item{order.items.length !== 1 && "s"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-text shrink-0">
                      {fmt.format(order.total)}
                    </span>
                  </div>

                  {/* Tracking */}
                  {(order.trackingNumber || order.estimatedDelivery) && (
                    <div className="pt-3 border-t border-border">
                      {order.estimatedDelivery && (
                        <p className="text-xs text-muted">
                          Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </p>
                      )}
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:text-accent/80 font-medium mt-1 inline-block"
                        >
                          Track Package
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
