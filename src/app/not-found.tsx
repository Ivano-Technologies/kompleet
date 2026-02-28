import Link from "next/link";
import { Home } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-bg dark:bg-dark-bg text-text-1 dark:text-dark-text-1">
      <LandingNav />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="font-display text-[120px] font-bold text-primary/10 dark:text-dark-text-4/10 leading-none select-none">
            404
          </div>
          <div className="-mt-8 space-y-3">
            <h1 className="font-display text-3xl font-bold text-text-1 dark:text-dark-text-1">
              Page Not Found
            </h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3 max-w-sm">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved. Head back to the homepage or your dashboard.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/"
              className="bg-accent text-charcoal font-bold text-sm px-6 py-3 rounded-md shadow-accent hover:bg-accent-hover transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="bg-transparent border-2 border-border dark:border-dark-border text-text-2 dark:text-dark-text-2 font-semibold text-sm px-6 py-3 rounded-md hover:border-primary hover:text-primary transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
