"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState({
    name: "",
    avatarUrl: "",
    bio: "",
    username: "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {}
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const currentPlan = user?.plan ?? "FREE";

  // Initialize form from user
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? "",
        avatarUrl: user.avatarUrl ?? "",
        bio: user.bio ?? "",
        username: user.username ?? "",
      });
    }
  }, [user?.name, user?.avatarUrl, user?.bio, user?.username]);

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profile.username.trim()) {
      errors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(profile.username)) {
      errors.username = "Only letters, numbers, hyphens, and underscores";
    }
    if (profile.bio.length > 160) {
      errors.bio = "Bio must be 160 characters or less";
    }
    if (profile.avatarUrl && profile.avatarUrl.trim()) {
      try {
        new URL(profile.avatarUrl);
      } catch {
        errors.avatarUrl = "Must be a valid URL";
      }
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setProfileSaving(true);
    setProfileSaved(false);

    try {
      // Check username availability if changed
      if (profile.username !== user?.username) {
        setUsernameChecking(true);
        const checkRes = await fetch("/api/user/username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: profile.username }),
        });
        setUsernameChecking(false);

        if (!checkRes.ok) {
          const err = await checkRes.json();
          setProfileErrors({ username: err.error ?? "Username unavailable" });
          setProfileSaving(false);
          return;
        }
      }

      // Update profile
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          name: profile.name,
          avatarUrl: profile.avatarUrl || null,
          bio: profile.bio || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setProfileErrors({ general: err.error ?? "Failed to save profile" });
      } else {
        setProfileSaved(true);
        await refreshUser();
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      setProfileErrors({ general: "Something went wrong" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch {
      // silently fail
    } finally {
      setBillingLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "DELETE",
      });
      if (res.ok) {
        router.replace("/login");
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  const planLabels: Record<string, { label: string; color: string }> = {
    FREE: { label: "Free", color: "bg-muted/20 text-muted" },
    CREATOR: { label: "Creator", color: "bg-accent/20 text-accent" },
    PRO: { label: "Pro", color: "bg-purple-500/20 text-purple-400" },
  };

  const planInfo = planLabels[currentPlan] ?? planLabels.FREE;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Manage your profile and account
        </p>
      </div>

      {/* Profile section */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-lg font-display font-semibold text-text">
          Profile
        </h2>

        <Input
          label="Display Name"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          placeholder="Your display name"
        />

        <Input
          label="Username"
          value={profile.username}
          onChange={(e) =>
            setProfile({
              ...profile,
              username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
            })
          }
          error={profileErrors.username}
          placeholder="yourname"
        />
        {profile.username && !profileErrors.username && (
          <p className="text-xs text-muted -mt-3">
            Your feed: scrollr.io/@{profile.username}
          </p>
        )}

        <Input
          label="Avatar URL"
          value={profile.avatarUrl}
          onChange={(e) =>
            setProfile({ ...profile, avatarUrl: e.target.value })
          }
          error={profileErrors.avatarUrl}
          placeholder="https://example.com/avatar.jpg"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">
            Bio{" "}
            <span className="text-xs">({profile.bio.length}/160)</span>
          </label>
          <textarea
            className="w-full px-3 py-2 bg-surface border border-border rounded-[var(--radius)] text-text placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 transition-all duration-200 ease-out resize-none"
            rows={3}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            maxLength={160}
            placeholder="Tell people about yourself..."
          />
          {profileErrors.bio && (
            <p className="text-sm text-destructive">{profileErrors.bio}</p>
          )}
        </div>

        {profileErrors.general && (
          <p className="text-sm text-destructive">{profileErrors.general}</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveProfile}
            loading={profileSaving || usernameChecking}
          >
            Save Changes
          </Button>
          {profileSaved && (
            <span className="text-sm text-green-400">Saved successfully</span>
          )}
        </div>
      </div>

      {/* Billing section */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-lg font-display font-semibold text-text">
          Billing
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text">Current Plan</p>
            <span
              className={`inline-block mt-1 text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${planInfo.color}`}
            >
              {planInfo.label}
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={handleManageBilling}
            loading={billingLoading}
          >
            Manage Billing
          </Button>
        </div>

        {currentPlan === "FREE" && (
          <div className="bg-surface rounded-lg p-4 border border-border">
            <p className="text-sm text-text font-medium mb-1">
              Upgrade to Creator or Pro
            </p>
            <p className="text-xs text-muted mb-3">
              Get more products, advanced analytics, and custom branding.
            </p>
            <Button size="sm" onClick={handleManageBilling}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Upgrade Now
            </Button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-card rounded-xl border border-destructive/30 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-destructive">
          Danger Zone
        </h2>
        <p className="text-sm text-muted">
          Permanently delete your account, all products, and analytics data.
          This cannot be undone.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete Account
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Account"
        description='This action is permanent and cannot be undone. Type "DELETE" to confirm.'
      >
        <div className="space-y-4 mt-2">
          <Input
            placeholder='Type "DELETE" to confirm'
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={deleteConfirmText !== "DELETE"}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
