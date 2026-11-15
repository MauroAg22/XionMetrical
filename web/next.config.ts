import type { NextConfig } from "next";

// Static export for GitHub Pages. In production the site lives under
// /XionMetrical (set NEXT_PUBLIC_BASE_PATH=/XionMetrical); locally it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
