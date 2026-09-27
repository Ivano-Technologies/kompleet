'use client';

import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AUTH_SUBTITLE, AUTH_TITLE } from '@/components/layout/auth-density';
import { CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <AuthLayout variant="dark-split">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <h1 className={AUTH_TITLE}>
          Email verification is not required
        </h1>
        <p className={AUTH_SUBTITLE}>
          Kompleet now uses Convex Auth with email and password. You can sign in
          immediately after creating an account.
        </p>
        <Link
          href="/login"
          className="bg-primary text-white font-bold text-sm py-2.5 px-6 rounded-md block w-full text-center hover:bg-primary-deep transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
