import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import { getPlants, getReminders } from "@/lib/api";
import { PlantThumbnail } from "@/components/plant-thumbnail";
import { QuickWaterButton } from "@/components/quick-water-button";
import { ThemeToggle } from "@/components/theme-toggle";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function fetchData() {
  try {
    const [plants, reminders] = await Promise.all([getPlants(), getReminders()]);
    return { plants, reminders };
  } catch {
    return { plants: [], reminders: [] };
  }
}

const FEATURES = [
  {
    icon: "🌿",
    title: "Plant management",
    description: "Track species, location, and watering schedules for every plant in your collection.",
  },
  {
    icon: "📋",
    title: "Care logging",
    description: "Log watering, fertilizing, pruning, and notes — each timestamped and searchable.",
  },
  {
    icon: "⏰",
    title: "Smart reminders",
    description: "Overdue plants surface instantly. Never let a plant go too long without attention.",
  },
  {
    icon: "🤖",
    title: "AI assistant",
    description: "Ask any plant health question. The AI uses your actual care history as context.",
  },
  {
    icon: "📸",
    title: "Photo gallery",
    description: "Upload photos over time and watch your plants grow, leaf by leaf.",
  },
  {
    icon: "📊",
    title: "Activity charts",
    description: "12-week care charts reveal your habits and show which plants get the most love.",
  },
];

export default async function HomePage() {
  const { plants, reminders } = await fetchData();
  const overdueMap = new Map(reminders.map((r) => [r.plant_id, r]));
  const coveragePct =
    plants.length === 0
      ? 0
      : Math.round(((plants.length - reminders.length) / plants.length) * 100);

  const preview = plants.slice(0, 3);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-8 md:px-10">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss dark:text-fern">Plant Care</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-ink dark:text-cream md:text-6xl">
            Keep every plant healthy, one log at a time.
          </h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Track watering schedules, get reminders, ask the AI assistant, and watch your plants grow through photos.
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-3 pt-1">
          <ThemeToggle />
          {clerkPublishableKey ? (
            <>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-px"
                >
                  Open dashboard →
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-px">
                    Sign in →
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-px"
            >
              Open dashboard →
            </Link>
          )}
        </div>
      </header>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Plants tracked</p>
          <p className="mt-3 text-4xl font-semibold text-ink dark:text-cream">{plants.length}</p>
        </article>
        <article className={`rounded-3xl border p-6 shadow-soft backdrop-blur ${
          reminders.length > 0
            ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30"
            : "border-black/5 bg-white/70 dark:border-white/10 dark:bg-white/5"
        }`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overdue reminders</p>
          <p className={`mt-3 text-4xl font-semibold ${reminders.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-ink dark:text-cream"}`}>
            {reminders.length}
          </p>
        </article>
        <article className={`rounded-3xl border p-6 shadow-soft backdrop-blur ${
          coveragePct === 100 && plants.length > 0
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30"
            : "border-black/5 bg-white/70 dark:border-white/10 dark:bg-white/5"
        }`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Reminder coverage</p>
          <p className={`mt-3 text-4xl font-semibold ${
            coveragePct === 100 && plants.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-ink dark:text-cream"
          }`}>
            {coveragePct}%
          </p>
        </article>
      </section>

      {/* ── Needs attention ─────────────────────────────────────────────── */}
      {reminders.length > 0 && (
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 dark:border-rose-800 dark:bg-rose-900/30">
          <div className="flex items-center gap-3">
            <span className="text-xl">💧</span>
            <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-300">
              {reminders.length === 1
                ? "1 plant needs watering"
                : `${reminders.length} plants need watering`}
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reminders.map((r) => (
              <div
                key={r.plant_id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.plant_name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {r.days_since_last_care === 0
                      ? "No care logged yet"
                      : `${r.days_since_last_care}d since last care`}
                  </p>
                </div>
                <QuickWaterButton plantId={r.plant_id} plantName={r.plant_name} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss dark:text-fern">What's inside</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-semibold text-ink dark:text-cream">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── At a glance ─────────────────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white/75 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">At a glance</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your most recent plants.</p>
          <div className="mt-5 space-y-3">
            {preview.length > 0 ? (
              preview.map((plant) => {
                const reminder = overdueMap.get(plant.id);
                return (
                  <Link
                    key={plant.id}
                    href={`/plant/${plant.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-cream p-3 transition hover:bg-cream/60 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    {plant.latest_photo ? (
                      <PlantThumbnail
                        src={`/api/uploads/${plant.id}/${plant.latest_photo.filename}`}
                        alt={plant.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/5 text-xl">
                        🌿
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink dark:text-cream">{plant.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{plant.species}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      reminder ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }`}>
                      {reminder
                        ? reminder.due_in_days <= 0 ? "Overdue" : `Due in ${reminder.due_in_days}d`
                        : "On track"}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-500">
                No plants yet —{" "}
                <Link href="/dashboard" className="underline underline-offset-2">
                  add your first one
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-fern">Ready to grow?</p>
          <h2 className="mt-4 text-2xl font-semibold leading-snug">
            Your plants are waiting.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Head to the dashboard to add plants, log care events, upload photos, and chat with the AI assistant.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-full bg-fern px-5 py-2.5 text-sm font-medium text-ink transition hover:-translate-y-px"
          >
            Go to dashboard →
          </Link>
        </div>
      </section>

    </main>
  );
}
