// Render-only page for the demo video (?scene=alert|montage). Not linked from the site.
import type { Metadata } from "next";
import VideoScene from "@/video/VideoScene";

export const metadata: Metadata = {
  title: "XionMetrical — video scene (render only)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VideoScene />;
}
