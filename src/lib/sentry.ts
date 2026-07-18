import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    enabled: process.env.NODE_ENV === "production",
  });
}

export function captureError(error: Error, context?: Record<string, string>) {
  if (!DSN) {
    console.error("[Sentry] Error:", error.message, context);
    return;
  }
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!DSN) return;
  Sentry.captureMessage(message, level);
}
