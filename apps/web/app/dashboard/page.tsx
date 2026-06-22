import Link from "next/link";

import { getPlants, getReminders } from "@/lib/api";
import { HealthChart } from "@/components/health-chart";
import { PlantActions } from "@/components/plant-actions";
import { PlantForm } from "@/components/plant-form";

export default async function DashboardPage() {
  const [plants, reminders] = await Promise.all([getPlants(), getReminders()]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Your plants, health, and reminders</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm font-medium text-moss underline-offset-4 hover:underline">
            Settings
          </Link>
          <Link href="/" className="text-sm font-medium text-moss underline-offset-4 hover:underline">
            Back home
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">Plant health</h2>
          <p className="mt-1 text-sm text-slate-500">Healthy vs overdue across all plants.</p>
          <div className="mt-4">
            <HealthChart total={plants.length} overdue={reminders.length} />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">Reminder queue</h2>
          <div className="mt-4 space-y-3">
            {reminders.map((item) => (
              <div key={item.plant_id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{item.plant_name}</p>
                  <span className="text-sm font-semibold text-soil">
                    {item.due_in_days <= 0 ? "Due now" : `Due in ${item.due_in_days} days`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.days_since_last_care} days since last care
                </p>
              </div>
            ))}
            {reminders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-500">
                No overdue plants right now.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] bg-white/75 p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Add a plant</h2>
        <p className="mt-2 text-sm text-slate-500">Create a new plant entry and start tracking its care history.</p>
        <div className="mt-4">
          <PlantForm />
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] bg-ink p-6 text-cream shadow-soft">
        <h2 className="text-xl font-semibold">All plants</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <div key={plant.id} className="flex gap-3 rounded-2xl bg-white/8 p-4">
              {plant.latest_photo ? (
                <img
                  src={`/api/uploads/${plant.id}/${plant.latest_photo.filename}`}
                  alt={plant.name}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                  🌿
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{plant.name}</p>
                <p className="mt-0.5 text-sm text-cream/70">
                  {plant.species} · {plant.location}
                </p>
                <div className="mt-2">
                  <PlantActions plant={plant} />
                </div>
              </div>
            </div>
          ))}
          {plants.length === 0 ? (
            <p className="rounded-2xl bg-white/8 p-4 text-sm text-cream/70">No plants yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
