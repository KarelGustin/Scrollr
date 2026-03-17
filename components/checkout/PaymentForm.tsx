"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { ShippingAddress } from "./AddressForm";
import type { ShippingOption } from "./ShippingOptions";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

interface PaymentFormProps {
  amount: number; // in cents
  onSuccess: (result: { orderId: string; orderNumber: string }) => void;
  onError: (error: string) => void;
  onBack: () => void;
  address: ShippingAddress;
  shippingOption: ShippingOption;
  guestEmail?: string; // For guest checkout
}

/**
 * Inner form that uses Stripe hooks (must be inside <Elements>)
 */
function CheckoutForm({
  amount,
  onSuccess,
  onError,
  onBack,
  address,
  shippingOption,
  guestEmail,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setPaymentError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPaymentError(submitError.message ?? "Payment validation failed");
        setSubmitting(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout`,
        },
        redirect: "if_required",
      });

      if (error) {
        setPaymentError(error.message ?? "Payment failed");
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Confirm and create orders on the backend
        const confirmRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "confirm",
            paymentIntentId: paymentIntent.id,
            address,
            shippingOption,
            ...(guestEmail ? { email: guestEmail } : {}),
          }),
        });

        if (!confirmRes.ok) {
          const data = await confirmRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create order");
        }

        const orderData = await confirmRes.json();
        onSuccess({
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
        });
      } else {
        setPaymentError("Payment was not completed. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setPaymentError(msg);
      onError(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-base font-display font-bold text-text mb-1">
        Payment
      </h2>

      <div className="bg-surface border border-border rounded-xl p-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {paymentError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          <p className="text-sm text-destructive">{paymentError}</p>
        </div>
      )}

      {/* Order total */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">Total</span>
          <span className="text-lg font-display font-bold text-text">
            {fmt.format(amount / 100)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="rounded-xl"
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={!stripe || !elements}
          className="flex-1 rounded-xl"
        >
          Pay {fmt.format(amount / 100)}
        </Button>
      </div>
    </form>
  );
}

/**
 * Wrapper that fetches a PaymentIntent client secret, then renders Elements
 */
export function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripePublishableKey) {
      const msg = "Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout.";
      setError(msg);
      setLoading(false);
      props.onError(msg);
    }
  }, [props]);

  useEffect(() => {
    if (!stripePublishableKey) return;
    let cancelled = false;

    async function createIntent() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-intent",
            address: props.address,
            shippingOption: props.shippingOption,
            ...(props.guestEmail ? { email: props.guestEmail } : {}),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create payment");
        }
        const data = await res.json();
        if (!cancelled) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to create payment";
          setError(msg);
          props.onError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    createIntent();
    return () => {
      cancelled = true;
    };
    // Only run once on mount for these specific props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" className="text-accent mb-3" />
        <p className="text-sm text-muted">Preparing payment...</p>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive mb-4">
          {error || "Unable to initialize payment."}
        </p>
        <Button variant="secondary" onClick={props.onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#FF6B4A",
            colorBackground: "#1a1a1a",
            colorText: "#f5f5f5",
            colorDanger: "#ef4444",
            borderRadius: "12px",
            fontFamily: "inherit",
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}
