"use client";

import { useState, useEffect } from "react";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";

export default function FollowButton({ creatorId }: { creatorId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/follows?followingId=${creatorId}`)
      .then((res) => res.json())
      .then((data) => {
        setIsFollowing(data.isFollowing ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [creatorId]);

  const handleToggle = async () => {
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
      // Silently handle — user may not be logged in
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-surface border border-border text-text hover:bg-surface/80"
          : "bg-accent text-accent-fg hover:bg-accent/90"
      }`}
    >
      {loading ? <ButtonSpinner /> : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
