import Link from "next/link";

import { getAllPhotos, getAllReminders, getPlants, getReminders } from "@/lib/api";
import { DashboardGallery } from "@/components/dashboard-gallery";
import { HealthChart } from "@/components/health-chart";
import { PlantForm } from "@/components/plant-form";
import { PlantGrid } from "@/components/plant-grid";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardPage() {
  const [plants, reminders, allReminders, allPhotos] = await Promise.all([
    getPlants(),
    getReminders(),
    getAllReminders(),
    getAllPhotos().catch(() => []),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss dark:text-fern">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">Your plants, health, and reminders</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/analytics" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
            Analytics
          </Link>
          <Link href="/settings" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
            Settings
          </Link>
          <Link href="/" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
            Back home
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">Plant health</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Healthy vs overdue across all plants.</p>
          <div className="mt-4">
            <HealthChart total={plants.length} overdue={reminders.length} />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">Reminder queue</h2>
          <div className="mt-4 space-y-3">
            {reminders.map((item) => (
              <div key={item.plant_id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink dark:text-cream">{item.plant_name}</p>
                  <span className="text-sm font-semibold text-soil dark:text-amber-300">
                    {item.due_in_days <= 0 ? "Due now" : `Due in ${item.due_in_days} days`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.days_since_last_care} days since last care
                </p>
              </div>
            ))}
            {reminders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No overdue plants right now.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
        <h2 className="text-xl font-semibold text-ink dark:text-cream">Add a plant</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create a new plant entry and start tracking its care history.</p>
        <div className="mt-4">
          <PlantForm />
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] bg-ink p-6 text-cream shadow-soft">
        <h2 className="text-xl font-semibold">All plants</h2>
        <div className="mt-4">
          <PlantGrid plants={plants} reminders={allReminders} />
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
        <h2 className="text-xl font-semibold text-ink dark:text-cream">Gallery</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          All photos across your plants. Click any photo to visit its plant page.
        </p>
        <div className="mt-4">
          <DashboardGallery photos={allPhotos} />
        </div>
      </section>
    </main>
  );
}
