import Link from "next/link";

// Placeholder landing (E0). The full landing is built in stage E3.
export default function Home() {
  return (
    <main className="starfield flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">XionMetrical</h1>
      <p className="text-lg text-muted">Precision bio-telemetry for deep space missions.</p>
      <p className="text-sm text-faint">Prototype · simulated data · not a medical device</p>
      <Link href="/demo/" className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-space-950">
        Try the demo
      </Link>
    </main>
  );
}
