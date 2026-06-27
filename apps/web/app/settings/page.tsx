import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";

import { ApiStatus } from "@/components/api-status";
import { SettingsDefaults } from "@/components/settings-defaults";
import { SettingsTimezone } from "@/components/settings-timezone";
import { NavAccount } from "@/components/nav-account";
import { ThemeToggle } from "@/components/theme-toggle";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const aiModel = process.env.AI_MODEL ?? "qwen2.5:0.5b";

async function getAccountInfo() {
  if (!clerkPublishableKey) {
    return { id: "dev-user", email: null, mode: "local" as const };
  }
  const { userId } = await auth();
  if (!userId) return { id: null, email: null, mode: "clerk-signedout" as const };
  const user = await currentUser();
  return { id: userId, email: user?.emailAddresses[0]?.emailAddress ?? null, mode: "clerk" as const };
}

export default async function SettingsPage() {
  const account = await getAccountInfo();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss dark:text-fern">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">Account &amp; preferences</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NavAccount />
          <ThemeToggle />
          <Link href="/dashboard" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-5">

        {/* ── Account ─────────────────────────────────────────────────── */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-lg font-semibold text-ink dark:text-cream">Account</h2>

          <dl className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/10">
            <Row label="Auth mode">
              {account.mode === "local" ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Local dev (no auth)
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Clerk
                </span>
              )}
            </Row>

            {account.mode === "local" && (
              <Row label="User ID">
                <code className="rounded bg-black/5 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">dev-user</code>
              </Row>
            )}

            {account.mode === "clerk" && (
              <>
                <Row label="Email">
                  <span className="text-ink dark:text-cream">{account.email ?? "—"}</span>
                </Row>
                <Row label="User ID">
                  <code className="rounded bg-black/5 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">{account.id}</code>
                </Row>
              </>
            )}

            {account.mode === "clerk-signedout" && (
              <Row label="Status">
                <span className="text-slate-500 dark:text-slate-400">Not signed in</span>
              </Row>
            )}

            <Row label="API">
              <ApiStatus />
            </Row>
          </dl>
        </section>

        {/* ── Plant defaults ───────────────────────────────────────────── */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-lg font-semibold text-ink dark:text-cream">Plant defaults</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Saved in your browser. Pre-fill the add-plant form automatically.
          </p>
          <SettingsDefaults />
        </section>

        {/* ── Timezone ─────────────────────────────────────────────────── */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-lg font-semibold text-ink dark:text-cream">Timezone</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dates and times in the care log will display in this timezone.
          </p>
          <SettingsTimezone />
        </section>

        {/* ── AI assistant ─────────────────────────────────────────────── */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink dark:text-cream">AI assistant</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Local LLM via Ollama — your data never leaves your machine.
          </p>

          <dl className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/10">
            <Row label="Model">
              <code className="rounded bg-black/5 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">{aiModel}</code>
            </Row>
            <Row label="Provider">
              <span className="text-ink dark:text-cream">Ollama (local)</span>
            </Row>
            <Row label="Where to find it">
              <span className="text-slate-600 dark:text-slate-400">Plant detail page → Ask the AI assistant</span>
            </Row>
          </dl>

          <div className="mt-4 rounded-2xl bg-black/5 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-400">
            <p className="font-medium text-ink dark:text-cream">Using Docker?</p>
            <p className="mt-1">The model is pulled automatically on first boot and cached. No manual setup required.</p>
            <p className="mt-3 font-medium text-ink dark:text-cream">Running locally?</p>
            <p className="mt-1">
              Install{" "}
              <a href="https://ollama.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Ollama
              </a>{" "}
              and the <code className="rounded bg-black/5 px-1 dark:bg-white/10">{aiModel}</code> model is pulled automatically when you run{" "}
              <code className="rounded bg-black/5 px-1 dark:bg-white/10">./run-local.sh</code>.
            </p>
          </div>
        </section>

        {/* ── Notifications ────────────────────────────────────────────── */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink dark:text-cream">Notifications</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
              Coming soon
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Email and push reminders for overdue plants.
          </p>

          <div className="mt-4 space-y-3">
            {[
              { label: "Email reminders", description: "Daily digest of overdue plants via SendGrid" },
              { label: "Push notifications", description: "Browser push when a plant becomes overdue" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-cream/50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-ink dark:text-cream">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{item.description}</p>
                </div>
                <div className="h-5 w-9 rounded-full bg-slate-200 opacity-50 dark:bg-white/20" />
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
