"use client";

import { useState, useEffect, useRef } from "react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check visit count
    const visitCount = parseInt(localStorage.getItem("scrollr_visit_count") || "0", 10) + 1;
    localStorage.setItem("scrollr_visit_count", String(visitCount));

    if (visitCount < 3) return;

    // Check if already dismissed
    if (localStorage.getItem("scrollr_install_dismissed") === "true") return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;
    deferredPromptRef.current.prompt();
    const result = await deferredPromptRef.current.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
    }
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("scrollr_install_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-display font-bold text-accent">S</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">Install Scrollr</p>
          <p className="text-xs text-muted mt-0.5">Get the best experience on your home screen</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted hover:text-text transition-colors"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="w-full mt-3 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
      >
        Install
      </button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
