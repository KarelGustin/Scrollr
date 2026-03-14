"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <>
      <main className="pb-[76px] md:pb-0">{children}</main>
      <BottomNav user={user} pathname={pathname} />
    </>
  );
}
