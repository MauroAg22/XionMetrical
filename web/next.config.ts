import type { NextConfig } from "next";

// Static export for GitHub Pages. In production the site lives under
// /XionMetrical (set NEXT_PUBLIC_BASE_PATH=/XionMetrical); locally it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  // No floating dev badge (it would show up in video frames rendered from `next dev`).
  devIndicators: false,
};

export default nextConfig;
