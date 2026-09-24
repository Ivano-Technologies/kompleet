'use client';

import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <AuthLayout variant="dark-split">
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">
          Email verification is not required
        </h1>
        <p className="text-text-3 dark:text-dark-text-3">
          Kompleet now uses Convex Auth with email and password. You can sign in
          immediately after creating an account.
        </p>
        <Link
          href="/login"
          className="bg-primary text-white font-bold text-sm py-3 px-6 rounded-md block w-full text-center hover:bg-primary-deep transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
