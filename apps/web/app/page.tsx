import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";

import { getFeed, getAllReminders, getPlants, getRecentLogs } from "@/lib/server-api";
import { PlantThumbnail } from "@/components/plant-thumbnail";
import { QuickWaterButton } from "@/components/quick-water-button";
import { NavAccount } from "@/components/nav-account";
import { QuickCareForm } from "@/components/quick-care-form";
import { ThemeToggle } from "@/components/theme-toggle";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function fetchData(userId: string) {
  try {
    const [plants, allReminders, feed, recentLogs] = await Promise.all([
      getPlants(userId),
      getAllReminders(userId),
      getFeed(userId).catch(() => []),
      getRecentLogs(userId, 10).catch(() => []),
    ]);
    return { plants, allReminders, feed, recentLogs };
  } catch {
    return { plants: [], allReminders: [], feed: [], recentLogs: [] };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const CARE_LABELS: Record<string, string> = {
  watering: "Watered",
  fertilizing: "Fertilized",
  pruning: "Pruned",
  notes: "Note",
};

const CARE_ICONS: Record<string, string> = {
  watering: "💧",
  fertilizing: "🌿",
  pruning: "✂️",
  notes: "📝",
};

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

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Add your plants",
    body: "Create an entry for each plant — name, species, location, and how often it needs water.",
  },
  {
    step: "2",
    title: "Log care as you go",
    body: "Tap to record watering, fertilizing, pruning, or leave a note. Every event is timestamped.",
  },
  {
    step: "3",
    title: "Never miss a beat",
    body: "Overdue and upcoming plants surface automatically. The AI assistant answers your care questions.",
  },
];

export default async function HomePage() {
  const { userId } = await auth();

  // ── Signed-out: landing page ─────────────────────────────────────────────
  if (!userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-8 md:px-10">

        {/* Hero */}
        <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss dark:text-fern">Plant Care</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-ink dark:text-cream md:text-6xl">
              Keep every plant healthy, one log at a time.
            </h1>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Track watering schedules, get reminders, ask the AI assistant, and watch your plants grow through photos.
            </p>
            <div className="mt-6">
              {clerkPublishableKey ? (
                <SignInButton mode="modal">
                  <button className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-px">
                    Get started →
                  </button>
                </SignInButton>
              ) : (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-px"
                >
                  Open dashboard →
                </Link>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-3 pt-1">
            <ThemeToggle />
            {clerkPublishableKey && (
              <SignInButton mode="modal">
                <button className="rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-ink transition hover:-translate-y-px dark:border-white/15 dark:text-cream">
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </header>

        {/* How it works */}
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss dark:text-fern">How it works</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <div key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss/10 text-sm font-semibold text-moss dark:bg-fern/10 dark:text-fern">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold text-ink dark:text-cream">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss dark:text-fern">What&apos;s inside</p>
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

        {/* Bottom CTA */}
        <section className="rounded-[2rem] bg-ink p-10 text-center text-cream shadow-soft">
          <h2 className="text-2xl font-semibold">Ready to start growing?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream/70">
            Join other gardeners tracking their plants, logging care, and keeping their collections thriving.
          </p>
          <div className="mt-6">
            {clerkPublishableKey ? (
              <SignInButton mode="modal">
                <button className="rounded-full bg-fern px-7 py-3 text-sm font-medium text-ink transition hover:-translate-y-px">
                  Create a free account →
                </button>
              </SignInButton>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-full bg-fern px-7 py-3 text-sm font-medium text-ink transition hover:-translate-y-px"
              >
                Open dashboard →
              </Link>
            )}
          </div>
        </section>

      </main>
    );
  }

  // ── Signed-in: app home ──────────────────────────────────────────────────
  const { plants, allReminders, feed, recentLogs } = await fetchData(userId);

  const overdueReminders = allReminders.filter((r) => r.due_in_days <= 0);
  const upcomingReminders = allReminders
    .filter((r) => r.due_in_days > 0 && r.due_in_days <= 2)
    .sort((a, b) => a.due_in_days - b.due_in_days);

  // Used in "At a glance" for per-plant status badges (all reminders, not just overdue)
  const reminderMap = new Map(allReminders.map((r) => [r.plant_id, r]));

  const coveragePct =
    plants.length === 0
      ? 0
      : Math.round(((plants.length - overdueReminders.length) / plants.length) * 100);

  const preview = plants.slice(0, 3);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-8 md:px-10">

      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss dark:text-fern">Plant Care</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">
            Your garden, at a glance.
          </h1>
        </div>

        <div className="flex shrink-0 items-start gap-3 pt-1">
          <NavAccount />
          <ThemeToggle />
          <Link
            href="/people"
            className="rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-ink transition hover:-translate-y-px dark:border-white/15 dark:text-cream"
          >
            Find people
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-px"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Plants tracked</p>
          <p className="mt-3 text-4xl font-semibold text-ink dark:text-cream">{plants.length}</p>
        </article>
        <article className={`rounded-3xl border p-6 shadow-soft backdrop-blur ${
          overdueReminders.length > 0
            ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30"
            : "border-black/5 bg-white/70 dark:border-white/10 dark:bg-white/5"
        }`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
          <p className={`mt-3 text-4xl font-semibold ${overdueReminders.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-ink dark:text-cream"}`}>
            {overdueReminders.length}
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

      {/* Needs attention — overdue */}
      {overdueReminders.length > 0 && (
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 dark:border-rose-800 dark:bg-rose-900/30">
          <div className="flex items-center gap-3">
            <span className="text-xl">💧</span>
            <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-300">
              {overdueReminders.length === 1
                ? "1 plant needs watering"
                : `${overdueReminders.length} plants need watering`}
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overdueReminders.map((r) => (
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

      {/* Coming up — due within 7 days */}
      {upcomingReminders.length > 0 && (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/30">
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300">Coming up</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingReminders.map((r) => (
              <Link
                key={r.plant_id}
                href={`/plant/${r.plant_id}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 p-4 transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/15"
              >
                <p className="truncate font-medium text-ink dark:text-cream">{r.plant_name}</p>
                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {r.due_in_days === 1 ? "Due tomorrow" : `Due in ${r.due_in_days}d`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick care */}
      <QuickCareForm plants={plants} />

      {/* Following feed */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">Following</h2>
          <Link href="/people" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
            Find people →
          </Link>
        </div>
        {feed.length === 0 ? (
          <p className="mt-4 rounded-[2rem] border border-dashed border-black/10 p-8 text-center text-sm text-slate-500 dark:border-white/10">
            Your feed is empty. <Link href="/people" className="underline underline-offset-2">Follow other gardeners</Link> to see their plant photos here.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {feed.map((item) => (
              <Link
                key={item.id}
                href={`/profile/${item.owner_id}`}
                className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/70 shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <PlantThumbnail
                  src={`/api/uploads/${item.plant_id}/${item.filename}`}
                  alt={item.caption ?? item.plant_name}
                  className="aspect-square w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white">
                  <span className="block font-medium">@{item.owner_display_name}</span>
                  <span className="block text-white/80">{item.plant_name}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="text-xl font-semibold text-ink dark:text-cream">Recent activity</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The last 10 care events across all your plants.</p>
        {recentLogs.length === 0 ? (
          <p className="mt-4 rounded-[2rem] border border-dashed border-black/10 p-8 text-center text-sm text-slate-500 dark:border-white/10">
            No care logged yet. Use the form above to record your first event.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-black/5 overflow-hidden rounded-[2rem] border border-black/5 bg-white/70 shadow-soft dark:divide-white/5 dark:border-white/10 dark:bg-white/5">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-lg">{CARE_ICONS[log.type] ?? "📋"}</span>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-ink dark:text-cream">{CARE_LABELS[log.type] ?? log.type}</span>
                  <span className="text-slate-500 dark:text-slate-400"> · </span>
                  <Link href={`/plant/${log.plant_id}`} className="text-moss underline-offset-2 hover:underline dark:text-fern">
                    {log.plant_name}
                  </Link>
                  {log.note && (
                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{log.note}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm text-slate-400">{timeAgo(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* At a glance */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white/75 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">At a glance</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your most recent plants.</p>
          <div className="mt-5 space-y-3">
            {preview.length > 0 ? (
              preview.map((plant) => {
                const reminder = reminderMap.get(plant.id);
                const isOverdue = reminder && reminder.due_in_days <= 0;
                const isUpcoming = reminder && reminder.due_in_days > 0;
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
                      isOverdue
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        : isUpcoming
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }`}>
                      {isOverdue
                        ? "Overdue"
                        : isUpcoming
                          ? `Due in ${reminder.due_in_days}d`
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
