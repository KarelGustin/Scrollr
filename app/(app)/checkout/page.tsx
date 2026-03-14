"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { AddressForm, type ShippingAddress } from "@/components/checkout/AddressForm";
import {
  ShippingOptions,
  type ShippingOption,
} from "@/components/checkout/ShippingOptions";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";

type Step = "address" | "shipping" | "payment" | "confirmation";

const STEPS: Step[] = ["address", "shipping", "payment", "confirmation"];

const STEP_LABELS: Record<Step, string> = {
  address: "Address",
  shipping: "Shipping",
  payment: "Payment",
  confirmation: "Done",
};

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

export default function CheckoutPage() {
  const { data: cartData, isLoading: cartLoading } = useCart();
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(
    null
  );
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

  const currentStepIndex = STEPS.indexOf(step);

  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // ── Handlers ──

  function handleAddressSubmit(addr: ShippingAddress) {
    setAddress(addr);
    setStep("shipping");
  }

  function handleShippingSelect(option: ShippingOption) {
    setShippingOption(option);
    setStep("payment");
  }

  function handlePaymentSuccess(result: {
    orderId: string;
    orderNumber: string;
  }) {
    setOrderResult(result);
    setStep("confirmation");
  }

  function handlePaymentError(error: string) {
    setPaymentError(error);
  }

  // ── Loading / empty states ──

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
            <h1 className="text-lg font-display font-bold text-text">
              Checkout
            </h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </div>
          <h2 className="text-base font-display font-bold text-text mb-1">
            Your cart is empty
          </h2>
          <p className="text-sm text-muted mb-5">
            Add some items before checking out.
          </p>
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
          <h1 className="text-lg font-display font-bold text-text">
            Checkout
          </h1>
          {step !== "confirmation" && (
            <span className="text-xs text-muted">
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress bar */}
        {step !== "confirmation" && (
          <div className="mb-8">
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex-1 flex items-center">
                  <div className="flex-1">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        i <= currentStepIndex ? "bg-accent" : "bg-border"
                      }`}
                    />
                    <p
                      className={`text-[10px] mt-1.5 font-medium ${
                        i === currentStepIndex
                          ? "text-text"
                          : i < currentStepIndex
                          ? "text-accent"
                          : "text-muted"
                      }`}
                    >
                      {STEP_LABELS[s]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
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
                onBack={() => setStep("address")}
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
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
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

          {/* Cart summary sidebar */}
          {step !== "confirmation" && (
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-4 sticky top-20">
                <h3 className="text-sm font-display font-bold text-text mb-4">
                  Order Summary
                </h3>

                {/* Items */}
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border overflow-hidden shrink-0">
                        {itemImage(item) ? (
                          <img
                            src={itemImage(item)!}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                            ?
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text truncate">
                          {itemName(item)}
                        </p>
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

                {/* Totals */}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="text-text">{fmt.format(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Shipping</span>
                    <span className="text-text">
                      {shippingOption
                        ? shippingCost === 0
                          ? "Free"
                          : fmt.format(shippingCost)
                        : "--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-border">
                    <span className="text-text">Total</span>
                    <span className="text-text text-base">
                      {fmt.format(total)}
                    </span>
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
