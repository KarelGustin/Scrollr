import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Scrollr — Shoppable Video Feeds for Influencers",
    template: "%s | Scrollr",
  },
  description:
    "Create a beautiful, swipeable video feed with affiliate links. Share one link, sell everywhere.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://scrollr.io"),
  openGraph: {
    title: "Scrollr — Shoppable Video Feeds for Influencers",
    description:
      "Create a beautiful, swipeable video feed with affiliate links. Share one link, sell everywhere.",
    siteName: "Scrollr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrollr — Shoppable Video Feeds for Influencers",
    description:
      "Create a beautiful, swipeable video feed with affiliate links. Share one link, sell everywhere.",
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
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-bg text-text min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
