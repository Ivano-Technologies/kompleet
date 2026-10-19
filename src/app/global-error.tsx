// src/app/global-error.tsx
"use client";

import NextError from "next/error";
import { useBoundaryRef } from "@/hooks/use-error-ref";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  // Reports and logs the raw error with the ref; never renders it.
  const ref = useBoundaryRef(error, "error-boundary:global");

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", marginBottom: "0.5rem" }}>
            Please try again. We&apos;ve been notified and are looking into it.
          </p>
          {ref ? (
            <p
              data-testid="error-ref"
              style={{
                color: "#6b7280",
                fontFamily: "ui-monospace, monospace",
                fontSize: "11px",
                marginBottom: "1.5rem",
              }}
            >
              Ref: {ref}
            </p>
          ) : null}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#008751",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
        </div>
        {/* NextError for fallback rendering */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
