import Link from "next/link";
import { LogIn, Home, ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-amber-600 dark:text-amber-400">
            401
          </h1>
          <h2 className="text-xl font-bold">Unauthorized</h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            You need to be logged in to access this page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
