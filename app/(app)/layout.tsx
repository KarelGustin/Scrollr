"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { MessagePopup } from "@/components/consumer/MessagePopup";
import { BottomNav } from "@/components/nav/BottomNav";
import { Sidebar } from "@/components/nav/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    if (status === "authenticated" && user && !user.username) {
      router.replace("/onboarding");
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg">
      <MessagePopup />
      <Sidebar />

      <main className="pb-[76px] md:pb-0 md:ml-[200px]">{children}</main>

      <BottomNav user={user} pathname={pathname} />
    </div>
  );
}
