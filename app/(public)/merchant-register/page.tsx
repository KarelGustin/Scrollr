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
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-text">Scrollr</h1>
          <p className="mt-2 text-muted">
            {mode === "signup" ? "Create your merchant account" : "Sign in as a merchant"}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-2">
            <p className="text-text font-medium">Check your email</p>
            <p className="text-muted text-sm">
              We sent a confirmation link to <span className="text-text">{email}</span>
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

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}
                className="text-sm text-muted hover:text-text transition-colors"
              >
                {mode === "signup"
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
              <p className="text-xs text-muted">
                Not a merchant?{" "}
                <Link href="/login" className="text-accent hover:underline">Sign in here</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
