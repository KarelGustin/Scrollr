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
  const allowGuestAccess = pathname === "/orders";

  useEffect(() => {
    if (status === "unauthenticated" && !allowGuestAccess) {
      router.replace("/login");
    }
  }, [allowGuestAccess, status, user, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!user && !allowGuestAccess) return null;

  return (
    <div className="min-h-screen bg-bg">
      {user && <MessagePopup />}
      <Sidebar />

      <main className="pb-[76px] md:pb-0 md:ml-[224px]">{children}</main>

      <BottomNav user={user} pathname={pathname} />
    </div>
  );
}
