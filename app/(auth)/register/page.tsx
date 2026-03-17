"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function RegisterPage() {
  const { user, status, refreshUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (user?.username) {
      router.replace("/dashboard");
    }
  }, [router, status, user?.username]);

  const checkUniqueness = useCallback(async (value: string) => {
    if (!USERNAME_REGEX.test(value)) return;

    setChecking(true);
    try {
      const res = await fetch(
        `/api/user/username?username=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      if (data.taken) {
        setError("Username is already taken");
      }
    } catch {
      setError("Could not check username");
    } finally {
      setChecking(false);
    }
  }, []);

  function validate(value: string) {
    if (value.length === 0) {
      setError("");
      return;
    }
    if (value.length < 3) {
      setError("Must be at least 3 characters");
      return;
    }
    if (value.length > 20) {
      setError("Must be 20 characters or fewer");
      return;
    }
    if (!USERNAME_REGEX.test(value)) {
      setError("Only letters, numbers, and underscores allowed");
      return;
    }
    setError("");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setUsername(value);
    validate(value);
  }

  function handleBlur() {
    if (USERNAME_REGEX.test(username)) {
      checkUniqueness(username);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!USERNAME_REGEX.test(username) || error) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      await refreshUser();
      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || status === "authenticated" && !user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-text">
            Choose your username
          </h1>
          <p className="mt-2 text-muted text-sm">
            This is your public profile URL
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-0">
            <span className="flex items-center h-[42px] px-3 bg-surface border border-r-0 border-border rounded-l-[var(--radius)] text-muted text-sm">
              @
            </span>
            <Input
              type="text"
              placeholder="username"
              value={username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={error}
              className="rounded-l-none"
              autoFocus
            />
          </div>

          {username && !error && (
            <p className="text-sm text-muted">
              scrollr.com/@{username}
            </p>
          )}

          <Button
            type="submit"
            loading={loading || checking}
            disabled={!USERNAME_REGEX.test(username) || !!error}
            className="w-full"
            size="lg"
          >
            Claim username
          </Button>
        </form>
      </div>
    </div>
  );
}
