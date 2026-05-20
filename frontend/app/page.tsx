import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-24">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          GigaChat · Smart Farming
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Welcome to GigaChat 🌿
        </h1>
        <p className="text-base text-muted-foreground">
          Your AI assistant for smarter farming, healthier crops, and better
          cultivation decisions. 🌾
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Start consultation
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground"
          >
            Plant knowledge base
          </Link>
        </div>
      </div>
    </main>
  );
}
