import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import { getPlants, getReminders } from "@/lib/api";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function fetchData() {
  try {
    const [plants, reminders] = await Promise.all([getPlants(), getReminders()]);
    return { plants, reminders };
  } catch {
    return { plants: [], reminders: [] };
  }
}

export default async function HomePage() {
  const { plants, reminders } = await fetchData();
  const overdueIds = new Set(reminders.map((r) => r.plant_id));
  const coveragePct =
    plants.length === 0
      ? 0
      : Math.round(((plants.length - reminders.length) / plants.length) * 100);

  const stats = [
    { label: "Plants tracked", value: String(plants.length) },
    { label: "Overdue reminders", value: String(reminders.length) },
    { label: "Reminder coverage", value: `${coveragePct}%` },
  ];

  const preview = plants.slice(0, 3);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-8 md:px-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss">Plant Care Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink md:text-6xl">
            A dashboard designed to keep track of your plants!
          </h1>
        </div>
        {clerkPublishableKey ? (
          <>
            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-soft transition hover:translate-y-[-1px]"
              >
                Open dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-soft transition hover:translate-y-[-1px]">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </>
        ) : (
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-soft transition hover:translate-y-[-1px]"
          >
            Open dashboard
          </Link>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-soft backdrop-blur">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/5 bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-fern">Core workflow</p>
          <h2 className="mt-4 text-3xl font-semibold">Log a care event, see the effect, and stay ahead of watering schedules.</h2>
          <p className="mt-4 max-w-2xl text-cream/80">
            This starter includes the frontend structure, backend API surface, reminder calculation, and a clean route map for later AI expansion.
          </p>
        </div>

        <div className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">At a glance</h2>
          <div className="mt-5 space-y-4">
            {preview.length > 0 ? (
              preview.map((plant) => (
                <div key={plant.id} className="rounded-2xl bg-cream p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">{plant.name}</p>
                      <p className="text-sm text-slate-500">{plant.species}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-moss">
                      {overdueIds.has(plant.id) ? "Needs water" : "On track"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{plant.location}</p>
                </div>
              ))
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
      </section>
    </main>
  );
}
