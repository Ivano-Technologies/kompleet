'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';

const LOGO_URL = '/assets/logo-primary.png';

export default function LandingNav() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={LOGO_URL} alt="KOMPLEET" width={32} height={32} className="rounded" />
          <span className="text-lg font-bold tracking-tight text-[rgb(var(--text-primary))]">
            KOMPLEET
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            How It Works
          </a>
          <Link
            href="/pricing"
            className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            Pricing
          </Link>
          <a
            href="#compliance"
            className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            Compliance
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <Link
            href="/login"
            className="btn-secondary px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"
          >
            Start Free (14 days) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--background))] px-4 py-4 space-y-3">
          <a href="#features" className="block text-sm font-medium py-2 text-[rgb(var(--text-primary))]">
            Features
          </a>
          <a href="#how-it-works" className="block text-sm font-medium py-2 text-[rgb(var(--text-primary))]">
            How It Works
          </a>
          <Link href="/pricing" className="block text-sm font-medium py-2 text-[rgb(var(--text-primary))]">
            Pricing
          </Link>
          <a href="#compliance" className="block text-sm font-medium py-2 text-[rgb(var(--text-primary))]">
            Compliance
          </a>
          <button
            onClick={toggleTheme}
            className="w-full p-2 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors flex items-center justify-center gap-2"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className="text-sm font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="btn-secondary px-4 py-2 rounded-lg text-sm font-semibold flex-1 text-center">
              Log In
            </Link>
            <Link href="/signup" className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex-1 text-center">
              Start Free (14 days)
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
