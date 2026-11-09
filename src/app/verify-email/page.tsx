import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg">
          <div className="text-text-1 dark:text-dark-text-1">Loading...</div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
