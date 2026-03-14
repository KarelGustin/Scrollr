import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Scrollr — Discover & Shop Through Short Videos",
    template: "%s | Scrollr",
  },
  description:
    "Discover products through short videos from creators you love. Scroll, tap, shop — all in one feed.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://scrollr.io"),
  openGraph: {
    title: "Scrollr — Discover & Shop Through Short Videos",
    description:
      "Discover products through short videos from creators you love. Scroll, tap, shop — all in one feed.",
    siteName: "Scrollr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrollr — Discover & Shop Through Short Videos",
    description:
      "Discover products through short videos from creators you love. Scroll, tap, shop — all in one feed.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAFAF8",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash script: apply dark class before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('scrollr-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-bg text-text min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
