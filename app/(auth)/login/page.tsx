"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

const valueProps = [
  "Scroll through shoppable short videos",
  "Discover products from creators you love",
  "Earn commissions as a creator",
  "Shop seamlessly without leaving the feed",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
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
          emailRedirectTo: `${window.location.origin}/discover`,
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
        // Role-aware redirect
        try {
          const profileRes = await fetch("/api/user/profile");
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.role === "ADMIN") {
              window.location.href = "/admin";
            } else if (profile.role === "CREATOR") {
              // Check if creator has seen the welcome screen
              const welcomed = localStorage.getItem("scrollr-creator-welcomed");
              window.location.href = welcomed ? "/dashboard" : "/dashboard/welcome";
            } else if (profile.role === "MERCHANT") {
              window.location.href = "/merchant";
            } else {
              window.location.href = "/discover";
            }
          } else {
            window.location.href = "/discover";
          }
        } catch {
          window.location.href = "/discover";
        }
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row">
      {/* Left panel — Brand hero (desktop) / Compact header (mobile) */}
      <div className="auth-hero-gradient lg:w-1/2 lg:min-h-screen flex flex-col items-center justify-center px-6 py-10 lg:py-0 relative overflow-hidden">
        {/* Decorative orb */}
        <div className="orb w-64 h-64 bg-coral/20 -top-20 -right-20 absolute hidden lg:block" />

        <div className="text-center max-w-md relative z-10">
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-text">Scrollr</h1>
          <p className="mt-3 text-lg lg:text-xl font-display font-bold gradient-text">
            Discover. Create. Shop.
          </p>

          {/* Rotating value props — desktop only */}
          <div className="hidden lg:block mt-8 h-8 relative">
            {valueProps.map((prop, i) => (
              <p
                key={i}
                className="absolute inset-x-0 text-sm text-muted"
                style={{
                  animation: `value-prop-cycle ${valueProps.length * 3}s ease-in-out infinite`,
                  animationDelay: `${i * 3}s`,
                  opacity: 0,
                }}
              >
                {prop}
              </p>
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
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
                mode === "login"
                  ? "bg-card text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Login
            </button>
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
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  {mode === "login" ? "Sign in" : "Create account"}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Social login placeholders */}
              <div className="space-y-3">
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-3 bg-surface border border-border rounded-xl text-sm text-muted cursor-not-allowed opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                  <span className="text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 ml-1">Soon</span>
                </button>
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-3 bg-surface border border-border rounded-xl text-sm text-muted cursor-not-allowed opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                  <span className="text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 ml-1">Soon</span>
                </button>
              </div>

              {/* Merchant callout */}
              <Link
                href="/merchant-register"
                className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-accent/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text group-hover:text-accent transition-colors">Merchant Login</p>
                  <p className="text-xs text-muted">Sell products through creator videos</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              <Link
                href="/discover"
                className="block w-full text-center py-3 text-sm font-medium text-muted hover:text-text transition-colors"
              >
                Back to Scrollr feed
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
