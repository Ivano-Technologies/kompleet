import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[rgb(var(--text-secondary))]">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
