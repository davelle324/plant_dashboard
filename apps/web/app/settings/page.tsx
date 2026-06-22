import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function getAccountInfo() {
  if (!clerkPublishableKey) {
    return { id: "dev-user", email: null, mode: "local" as const };
  }
  const { userId } = await auth();
  if (!userId) {
    return { id: null, email: null, mode: "clerk-signedout" as const };
  }
  const user = await currentUser();
  return {
    id: userId,
    email: user?.emailAddresses[0]?.emailAddress ?? null,
    mode: "clerk" as const,
  };
}

export default async function SettingsPage() {
  const account = await getAccountInfo();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Account &amp; preferences</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-moss underline-offset-4 hover:underline">
          Back to dashboard
        </Link>
      </div>

      <div className="mt-8 space-y-6">

        {/* Account */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Account</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
              <dt className="text-slate-500">Mode</dt>
              <dd className="font-medium text-ink">
                {account.mode === "local" ? "Local dev (no auth)" : "Clerk authentication"}
              </dd>
            </div>
            {account.mode === "local" && (
              <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
                <dt className="text-slate-500">User</dt>
                <dd className="font-mono text-xs text-slate-600">dev-user</dd>
              </div>
            )}
            {account.mode === "clerk" && (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-ink">{account.email ?? "—"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">User ID</dt>
                  <dd className="font-mono text-xs text-slate-600">{account.id}</dd>
                </div>
              </>
            )}
            {account.mode === "clerk-signedout" && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="text-slate-600">Not signed in</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Plant defaults */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Plant defaults</h2>
          <p className="mt-1 text-sm text-slate-500">
            These will pre-fill the add-plant form. Not yet persisted to the server.
          </p>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-4">
              <dt className="text-slate-500">Default watering interval</dt>
              <dd className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink">7 days</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Default location</dt>
              <dd className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink">—</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Configurable defaults coming in a future update.
          </p>
        </section>

        {/* Notifications */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Notifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            Email and push reminders for overdue plants.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-400">
            Coming in a future update — planned via SendGrid for email and the reminder cron job.
          </div>
        </section>

        {/* AI */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">AI assistant</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ask questions about your plants using a local LLM.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-400">
            Phase 2 — planned via Ollama (Llama 3.1 8B or Qwen 8B). The backend stub is already live at{" "}
            <code className="font-mono">POST /ai/ask</code>.
          </div>
        </section>

      </div>
    </main>
  );
}
