"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface OrderConfirmationProps {
  orderId: string;
  orderNumber: string;
}

export function OrderConfirmation({
  orderNumber,
}: OrderConfirmationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {/* Animated checkmark */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
          <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success animate-[draw-check_0.5s_ease-out_0.3s_both]"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-display font-bold text-text mb-2">
        Order Confirmed!
      </h2>
      <p className="text-sm text-muted mb-1">
        Thank you for your purchase.
      </p>
      <p className="text-sm text-muted mb-8">
        Order number:{" "}
        <span className="font-mono text-text font-semibold">
          #{orderNumber.slice(-8).toUpperCase()}
        </span>
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link href="/orders" className="flex-1">
          <Button variant="secondary" className="w-full rounded-xl">
            View Orders
          </Button>
        </Link>
        <Link href="/discover" className="flex-1">
          <Button className="w-full rounded-xl">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Keyframes for the animation */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes draw-check {
          from {
            stroke-dasharray: 30;
            stroke-dashoffset: 30;
          }
          to {
            stroke-dasharray: 30;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
