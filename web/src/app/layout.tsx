import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XionMetrical — Precision bio-telemetry for deep space missions",
  description:
    "Educational prototype for the 2026 NASA Space Apps Challenge: astronaut health monitoring for a Mars mission, built around each astronaut's personal baseline. Simulated data · not a medical device · built with AI assistance (declared).",
  generator: "Next.js (static export) · code written with AI assistance (Claude Code), reviewed by Team Space Mercedes",
};

export const viewport: Viewport = {
  themeColor: "#040914",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-space-950 text-ink antialiased">{children}</body>
    </html>
  );
}
