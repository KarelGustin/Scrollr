"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/lib/auth-context";
import { AddressForm, type ShippingAddress } from "@/components/checkout/AddressForm";
import {
  ShippingOptions,
  type ShippingOption,
} from "@/components/checkout/ShippingOptions";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";

type Step = "email" | "address" | "shipping" | "payment" | "confirmation";

type CartItemData = {
  id: string;
  quantity: number;
  selectedSize: string | null;
  product: {
    id: string;
    name: string;
    price: number | null;
    imageUrl: string | null;
    brand: string | null;
  } | null;
  merchantProduct: {
    id: string;
    title: string;
    price: number;
    imageUrl: string | null;
    currency: string;
    merchant: {
      id: string;
      storeName: string | null;
      storeLogoUrl: string | null;
    };
  } | null;
};

function itemName(item: CartItemData): string {
  return item.merchantProduct?.title ?? item.product?.name ?? "Product";
}

function itemPrice(item: CartItemData): number {
  return item.merchantProduct?.price ?? item.product?.price ?? 0;
}

function itemImage(item: CartItemData): string | null {
  return item.merchantProduct?.imageUrl ?? item.product?.imageUrl ?? null;
}

export default function PublicCheckoutPage() {
  const { data: cartData, isLoading: cartLoading } = useCart();
  const { user, status: authStatus } = useAuth();
  const isAuthenticated = authStatus === "authenticated" && !!user;

  const [step, setStep] = useState<Step>(isAuthenticated ? "address" : "email");
  const [guestEmail, setGuestEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const items: CartItemData[] = cartData?.items ?? [];

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + itemPrice(item) * item.quantity, 0),
    [items]
  );

  const shippingCost = shippingOption?.price ?? 0;
  const total = subtotal + shippingCost;
  const totalCents = Math.round(total * 100);

  // Group items by merchant for display
  const merchantGroups = useMemo(() => {
    const groups = new Map<string, { name: string; logo: string | null; items: CartItemData[] }>();
    for (const item of items) {
      if (item.merchantProduct) {
        const mid = item.merchantProduct.merchant.id;
        if (!groups.has(mid)) {
          groups.set(mid, {
            name: item.merchantProduct.merchant.storeName ?? "Store",
            logo: item.merchantProduct.merchant.storeLogoUrl ?? null,
            items: [],
          });
        }
        groups.get(mid)!.items.push(item);
      }
    }
    return Array.from(groups.values());
  }, [items]);

  const allSteps: Step[] = isAuthenticated
    ? ["address", "shipping", "payment", "confirmation"]
    : ["email", "address", "shipping", "payment", "confirmation"];

  const visibleSteps = allSteps.filter((s) => s !== "confirmation");
  const currentStepIndex = visibleSteps.indexOf(step);

  const fmt = new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  });

  const effectiveEmail = isAuthenticated ? user!.email : guestEmail;

  function handleEmailSubmit() {
    const email = guestEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setStep("address");
  }

  function handleAddressSubmit(addr: ShippingAddress) {
    setAddress(addr);
    setStep("shipping");
  }

  function handleShippingSelect(option: ShippingOption) {
    setShippingOption(option);
    setStep("payment");
  }

  function handlePaymentSuccess(result: { orderId: string; orderNumber: string }) {
    setOrderResult(result);
    setStep("confirmation");
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!items.length && step !== "confirmation") {
    return (
      <div className="min-h-screen bg-bg">
        <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
          <div className="px-5 py-3">
            <h1 className="text-lg font-display font-bold text-text">Checkout</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </div>
          <h2 className="text-base font-display font-bold text-text mb-1">Your cart is empty</h2>
          <p className="text-sm text-muted mb-5">Add some items before checking out.</p>
          <Link
            href="/discover"
            className="inline-flex items-center px-5 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-full hover:bg-accent/90 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-3 flex items-center justify-between">
          <h1 className="text-lg font-display font-bold text-text">Checkout</h1>
          {step !== "confirmation" && (
            <span className="text-xs text-muted">
              Step {currentStepIndex + 1} of {visibleSteps.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress bar */}
        {step !== "confirmation" && (
          <div className="mb-8">
            <div className="flex items-center gap-1">
              {visibleSteps.map((s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      i <= currentStepIndex ? "bg-accent" : "bg-border"
                    }`}
                  />
                  <p
                    className={`text-[10px] mt-1.5 font-medium capitalize ${
                      i === currentStepIndex ? "text-text" : i < currentStepIndex ? "text-accent" : "text-muted"
                    }`}
                  >
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Guest email step */}
            {step === "email" && (
              <div className="space-y-5">
                <h2 className="text-base font-display font-bold text-text">
                  Contact Information
                </h2>
                <p className="text-sm text-muted">
                  Enter your email to receive order updates. No account required.
                </p>
                <div>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="your@email.com"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent/50 placeholder:text-muted/60"
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive mt-1.5">{emailError}</p>
                  )}
                </div>
                <button
                  onClick={handleEmailSubmit}
                  className="w-full py-3 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  Continue to Shipping
                </button>
                <div className="text-center">
                  <Link href="/login?callbackUrl=/checkout" className="text-xs text-accent hover:text-accent/80 transition-colors">
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            )}

            {step === "address" && (
              <AddressForm
                onSubmit={handleAddressSubmit}
                initialAddress={address ?? undefined}
              />
            )}

            {step === "shipping" && address && (
              <ShippingOptions
                address={address}
                onSelect={handleShippingSelect}
                onBack={() => setStep(isAuthenticated ? "address" : "email")}
              />
            )}

            {step === "payment" && address && shippingOption && (
              <>
                {paymentError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
                    <p className="text-sm text-destructive">{paymentError}</p>
                  </div>
                )}
                <PaymentForm
                  amount={totalCents}
                  address={address}
                  shippingOption={shippingOption}
                  guestEmail={isAuthenticated ? undefined : guestEmail}
                  onSuccess={handlePaymentSuccess}
                  onError={setPaymentError}
                  onBack={() => setStep("shipping")}
                />
              </>
            )}

            {step === "confirmation" && orderResult && (
              <OrderConfirmation
                orderId={orderResult.orderId}
                orderNumber={orderResult.orderNumber}
              />
            )}
          </div>

          {/* Cart summary sidebar — grouped by merchant */}
          {step !== "confirmation" && (
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-4 sticky top-20">
                <h3 className="text-sm font-display font-bold text-text mb-4">
                  Order Summary
                </h3>

                {/* Items grouped by merchant */}
                <div className="space-y-4 mb-4">
                  {merchantGroups.map((group) => (
                    <div key={group.name}>
                      <div className="flex items-center gap-2 mb-2">
                        {group.logo && (
                          <img src={group.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                          {group.name}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface border border-border overflow-hidden shrink-0">
                              {itemImage(item) ? (
                                <img src={itemImage(item)!} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted text-xs">?</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text truncate">{itemName(item)}</p>
                              <p className="text-xs text-muted">
                                Qty: {item.quantity}
                                {item.selectedSize && ` / ${item.selectedSize}`}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-text shrink-0">
                              {fmt.format(itemPrice(item) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="text-text">{fmt.format(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Shipping</span>
                    <span className="text-text">
                      {shippingOption ? (shippingCost === 0 ? "Free" : fmt.format(shippingCost)) : "--"}
                    </span>
                  </div>
                  {effectiveEmail && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Email</span>
                      <span className="text-muted truncate ml-2">{effectiveEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-border">
                    <span className="text-text">Total</span>
                    <span className="text-text text-base">{fmt.format(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
