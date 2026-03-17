"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";

export default function VideoFollowPill({ creatorId }: { creatorId: string }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwnVideo = user?.id === creatorId;

  useEffect(() => {
    if (isOwnVideo || status !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch(`/api/follows?followingId=${creatorId}`)
      .then((res) => res.json())
      .then((data) => {
        setIsFollowing(data.isFollowing ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [creatorId, status, isOwnVideo]);

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await fetch("/api/follows", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: creatorId }),
        });
        setIsFollowing(false);
      } else {
        await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: creatorId }),
        });
        setIsFollowing(true);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [creatorId, isFollowing, status, router]);

  // Hide on own videos or while loading initial state
  if (isOwnVideo) return null;
  if (loading && status === "authenticated") return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs font-semibold px-3 py-1 rounded-full transition-all disabled:opacity-50 ${
        isFollowing
          ? "bg-white/10 border border-white/20 text-white"
          : "bg-white/20 backdrop-blur-sm text-white"
      }`}
    >
      {loading ? <ButtonSpinner className="h-3 w-3" /> : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
