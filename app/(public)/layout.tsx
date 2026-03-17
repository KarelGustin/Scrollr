"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";
import { Sidebar } from "@/components/nav/Sidebar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <>
      <Sidebar />
      <main className="pb-[76px] md:pb-0 md:ml-[224px]">{children}</main>
      <BottomNav user={user} pathname={pathname} />
    </>
  );
}
