"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "./supabase-browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AppSession {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  plan: string;
  role: string;
}

interface AuthContextValue {
  user: AppSession | null;
  supabaseUser: SupabaseUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  status: "loading",
  refreshUser: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<AppSession | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const fetchProfile = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {
      // Profile fetch failed, user might not exist in Prisma yet
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: su } } = await supabase.auth.getUser();
    if (su?.email) {
      await fetchProfile(su.email);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user: su } }) => {
      setSupabaseUser(su);
      if (su?.email) {
        setStatus("authenticated");
        fetchProfile(su.email);
      } else {
        setStatus("unauthenticated");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const su = session?.user ?? null;
        setSupabaseUser(su);
        if (su?.email) {
          setStatus("authenticated");
          await fetchProfile(su.email);
        } else {
          setStatus("unauthenticated");
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setStatus("unauthenticated");
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, supabaseUser, status, refreshUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
