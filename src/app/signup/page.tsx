'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in page (Supabase Auth UI handles both sign-in and sign-up)
    router.replace('/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
        <p className="mt-4 text-green-700">Redirecting to sign up...</p>
      </div>
    </div>
  );
}
