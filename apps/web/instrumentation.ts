export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }

  // Only print once on the Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const sentryDsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

    console.log("");
    console.log("  ┌─ Plant Care Web ───────────────────────────────────────────┐");
    if (clerkKey) {
      console.log(`  │  Clerk   : connected (${clerkKey.slice(0, 38)}...)`);
    } else {
      console.log("  │  Clerk   : disabled  (no-auth dev mode — set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)");
    }
    if (sentryDsn) {
      console.log(`  │  Sentry  : connected (${sentryDsn.slice(0, 38)}...)`);
    } else {
      console.log("  │  Sentry  : disabled  (set SENTRY_DSN to enable)");
    }
    console.log("  └────────────────────────────────────────────────────────────┘");
    console.log("");
  }
}
