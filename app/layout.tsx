import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Scrollr — Shoppable Video Feeds for Influencers",
  description:
    "Create a beautiful, swipeable video feed with affiliate links. Share one link, sell everywhere.",
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
