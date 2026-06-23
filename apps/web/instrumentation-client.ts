import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [Sentry.replayIntegration()],
  });
  console.log("[startup] Sentry (client): connected");
} else {
  console.log("[startup] Sentry (client): disabled (NEXT_PUBLIC_SENTRY_DSN not set)");
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
