"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import type { CreatorApplicationData } from "@/types";

export function CreatorApplicationStatus() {
  const { user } = useAuth();

  const { data: application } = useQuery<CreatorApplicationData | null>({
    queryKey: ["creator-application"],
    queryFn: async () => {
      const res = await fetch("/api/creator-application");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: user?.role === "USER",
  });

  // Don't show for creators or admins
  if (user?.role !== "USER") return null;

  // No application yet — show CTA
  if (!application) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-display font-bold text-text">
              Want to create and sell on Scrollr?
            </h3>
            <p className="text-xs text-muted mt-1 mb-3">
              Apply to become a creator and unlock video uploads, product tagging, and earnings.
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              Apply Now
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending
  if (application.status === "PENDING") {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-text">
              Application under review
            </h3>
            <p className="text-xs text-muted mt-1">
              We&apos;re reviewing your creator application. You&apos;ll receive an email once it&apos;s been reviewed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected
  if (application.status === "REJECTED") {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-display font-bold text-text">
              Application not approved
            </h3>
            {application.adminNote && (
              <p className="text-xs text-muted mt-1">
                Feedback: {application.adminNote}
              </p>
            )}
            <p className="text-xs text-muted mt-1 mb-3">
              You can update your profile and apply again.
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              Apply Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
