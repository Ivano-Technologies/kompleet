// instrumentation-client.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // --- Error Monitoring ---
  // Send request headers and IP for user context
  sendDefaultPii: true,

  // --- Performance Monitoring ---
  // 100% in dev, 10% in production (adjust based on traffic)
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // --- Session Replay ---
  // Capture 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // --- Logs ---
  enableLogs: true,

  // --- Integrations ---
  integrations: [
    // Session Replay: video-like reproduction of user sessions
    Sentry.replayIntegration({
      maskAllText: true, // Mask all text for privacy (NDPR compliance)
      maskAllInputs: true, // Mask form inputs (tax data is sensitive)
      blockAllMedia: true, // Block media elements
    }),

    // User Feedback: widget for users to report bugs
    Sentry.feedbackIntegration({
      colorScheme: "system",
      showBranding: false,
      buttonLabel: "Report a Bug",
      submitButtonLabel: "Send Report",
      formTitle: "Report a Problem",
      messagePlaceholder: "What happened? What did you expect?",
    }),
  ],

  // --- Environment ---
  environment: process.env.NODE_ENV,

  // --- Data Scrubbing ---
  // Strip sensitive financial data before sending to Sentry
  beforeSend(event) {
    // Remove any accidentally captured tax data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((crumb) => {
        if (crumb.data) {
          // Redact fields that might contain financial info
          const sensitiveKeys = [
            "turnover",
            "profit",
            "income",
            "assets",
            "tin",
            "ssn",
            "bvn",
          ];
          for (const key of sensitiveKeys) {
            if (key in crumb.data) {
              crumb.data[key] = "[REDACTED]";
            }
          }
        }
        return crumb;
      });
    }
    return event;
  },
});

// Instrument Next.js router transitions for performance tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
