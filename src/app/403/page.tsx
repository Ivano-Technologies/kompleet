import Link from 'next/link';
import { Home, ShieldX, LayoutDashboard } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldX className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-red-600 dark:text-red-400">403</h1>
          <h2 className="text-xl font-bold">Forbidden</h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            You don&apos;t have permission to access this resource.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
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
