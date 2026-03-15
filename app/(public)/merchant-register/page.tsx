"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function MerchantRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [sent, setSent] = useState(false);

  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/merchant-onboarding`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSent(true);
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        window.location.href = "/merchant-onboarding";
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row">
      {/* Left panel — Merchant hero */}
      <div className="auth-hero-gradient lg:w-1/2 lg:min-h-screen flex flex-col items-center justify-center px-6 py-10 lg:py-0 relative overflow-hidden">
        {/* Decorative orb */}
        <div className="orb w-64 h-64 bg-coral/20 -bottom-20 -left-20 absolute hidden lg:block" />

        <div className="text-center max-w-md relative z-10">
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-text">Scrollr</h1>
          <p className="mt-3 text-lg lg:text-xl font-display font-bold gradient-text">
            Grow your brand with video commerce
          </p>

          {/* Merchant value props — desktop only */}
          <div className="hidden lg:block mt-8 space-y-4">
            {[
              { icon: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z", label: "Sync products from Shopify automatically" },
              { icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941", label: "Reach new customers through creator content" },
              { icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Drive sales with shoppable short videos" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d={item.icon} />
                  </svg>
                </div>
                <p className="text-sm text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-0">
        <div className="w-full max-w-sm space-y-6">
          {/* Pill toggle */}
          <div className="flex bg-surface rounded-full p-1">
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
                mode === "signup"
                  ? "bg-card text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
                mode === "login"
                  ? "bg-card text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Login
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted">
              {mode === "signup" ? "Create your merchant account" : "Sign in as a merchant"}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-2 py-8">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-text font-semibold text-lg">Check your email</p>
              <p className="text-muted text-sm">
                We sent a confirmation link to <span className="text-text font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  {mode === "signup" ? "Create Merchant Account" : "Sign in"}
                </Button>
              </form>

              {/* Not a merchant? */}
              <div className="text-center">
                <p className="text-sm text-muted">
                  Not a merchant?{" "}
                  <Link href="/login" className="text-accent hover:underline font-medium">
                    Sign in as a user
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
