"use client";

import { useRouter } from "next/navigation";

const confettiDots = [
  { x: "-60px", y: "-80px", color: "bg-accent", delay: "0s" },
  { x: "70px", y: "-60px", color: "bg-success", delay: "0.05s" },
  { x: "90px", y: "20px", color: "bg-coral-soft", delay: "0.1s" },
  { x: "50px", y: "80px", color: "bg-warning", delay: "0.15s" },
  { x: "-40px", y: "90px", color: "bg-social", delay: "0.2s" },
  { x: "-90px", y: "30px", color: "bg-accent", delay: "0.25s" },
  { x: "-70px", y: "-40px", color: "bg-success", delay: "0.3s" },
  { x: "30px", y: "-90px", color: "bg-warning", delay: "0.35s" },
];

const features = [
  {
    title: "Unlimited Uploads",
    description: "Post as many shoppable videos as you want",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    title: "Earn 3% Commission",
    description: "On every sale from products in your videos",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: "Analytics Dashboard",
    description: "Track views, engagement, and earnings",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-social">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export default function CreatorWelcomePage() {
  const router = useRouter();

  function handleStart() {
    localStorage.setItem("scrollr-creator-welcomed", "true");
    router.push("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Animated checkmark with confetti */}
        <div className="relative mx-auto w-24 h-24">
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse-ring" />

          {/* Checkmark circle */}
          <div className="relative w-24 h-24 rounded-full bg-success/10 flex items-center justify-center animate-in zoom-in duration-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Confetti dots */}
          {confettiDots.map((dot, i) => (
            <div
              key={i}
              className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full ${dot.color}`}
              style={{
                "--x": dot.x,
                "--y": dot.y,
                animation: "confetti-burst 0.8s ease-out forwards",
                animationDelay: dot.delay,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl font-display font-extrabold text-text">
            Welcome to the Creator Program!
          </h1>
          <p className="mt-3 text-muted">
            You&apos;ve been accepted. Start earning now by posting great content.
          </p>
        </div>

        {/* Feature cards */}
        <div className="space-y-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl text-left animate-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${300 + i * 100}ms`, animationFillMode: "backwards" }}
            >
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                {feature.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{feature.title}</p>
                <p className="text-xs text-muted mt-0.5">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-accent text-accent-fg text-sm font-bold rounded-2xl hover:bg-accent/90 transition-colors active:scale-[0.98]"
          >
            Start Creating
          </button>
          <button
            onClick={handleStart}
            className="w-full py-2 text-sm text-muted hover:text-text transition-colors"
          >
            Explore your dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
