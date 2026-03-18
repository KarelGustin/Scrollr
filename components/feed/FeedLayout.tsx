"use client";

import type { ReactNode } from "react";

interface FeedLayoutProps {
  children: ReactNode;
  contextPanelSlot?: ReactNode;
}

export default function FeedLayout({ children, contextPanelSlot }: FeedLayoutProps) {
  return (
    <div className="fixed inset-0 md:left-[224px] flex z-30 overflow-hidden">
      {/* Feed column — full-bleed on mobile, 50% on desktop */}
      <div className="relative w-full lg:flex-1 h-full bg-black lg:max-w-[50%]">
        {children}
      </div>

      {/* Context panel — desktop only, 50% */}
      {contextPanelSlot && (
        <div className="hidden lg:flex lg:flex-col flex-1 min-w-0 h-full overflow-y-auto bg-bg border-l border-border">
          {contextPanelSlot}
        </div>
      )}
    </div>
  );
}
