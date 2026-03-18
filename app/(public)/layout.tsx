"use client";

import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/nav/BottomNav";
import { Sidebar } from "@/components/nav/Sidebar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <>
      <Sidebar />
      <main className="pb-[72px] md:pb-0 md:ml-[224px]">{children}</main>
      <BottomNav user={user} />
    </>
  );
}
