import type { Metadata } from "next";
import DemoApp from "@/components/demo/DemoApp";

export const metadata: Metadata = {
  title: "Interactive demo — XionMetrical",
  description:
    "Simulated 1,080-day Mars mission (180 days out, 720 on the surface, 180 back): 10 health indicators, personal baseline, traffic light, trends, sourced guidance and an emergency guide. Prototype, not a medical device.",
};

export default function DemoPage() {
  return <DemoApp />;
}
