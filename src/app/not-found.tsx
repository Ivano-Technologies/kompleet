import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <h1 className="text-7xl font-bold text-[rgb(var(--primary))]">404</h1>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Page Not Found</h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}
