import Link from "next/link";

import { getPlant, getPlantLogs, getPhotos } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { computeHealthScore, healthColor } from "@/lib/health";
import { AiChat } from "@/components/ai-chat";
import { CareChart } from "@/components/care-chart";
import { LogEntryCard } from "@/components/log-entry-card";
import { LogForm } from "@/components/log-form";
import { PhotoGallery } from "@/components/photo-gallery";
import { PlantForm } from "@/components/plant-form";
import { ThemeToggle } from "@/components/theme-toggle";

type PlantPageProps = {
  params: { id: string };
};

export default async function PlantDetailPage({ params }: PlantPageProps) {
  const { id } = params;
  const [plant, logs, photosResult] = await Promise.all([
    getPlant(id),
    getPlantLogs(id),
    getPhotos(Number(id)).catch(() => []),
  ]);
  const photos = photosResult;

  const lastWatering = logs.find((l) => l.type === "watering");
  const lastCare = lastWatering?.created_at ?? logs[0]?.created_at ?? plant.created_at;
  const daysSinceLastCare = Math.max(
    Math.floor((Date.now() - new Date(lastCare).getTime()) / 86_400_000),
    0
  );
  const due_in_days = plant.watering_interval_days - daysSinceLastCare;
  const healthScore = computeHealthScore(due_in_days, plant.watering_interval_days);
  const healthBadgeClass = healthColor(healthScore);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-sm font-medium text-ink transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-cream dark:hover:bg-white/10"
        >
          ← Dashboard
        </Link>
        <ThemeToggle />
      </div>
      <p className="mt-4 text-sm uppercase tracking-[0.3em] text-moss dark:text-fern">Plant detail</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{plant.name}</h1>

      <div className="mt-8 space-y-6">
        {/* Top row: health summary + care history */}
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
            <h2 className="text-xl font-semibold text-ink dark:text-cream">Health summary</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Last watered</dt>
                <dd className="mt-1 font-medium text-ink dark:text-cream">{formatDate(lastCare)}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Days since last care</dt>
                <dd className="mt-1 font-medium text-ink dark:text-cream">{daysSinceLastCare}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Health score</dt>
                <dd className={`mt-1 inline-flex items-baseline gap-1 rounded-full px-3 py-1 font-semibold ${healthBadgeClass}`}>
                  <span className="text-2xl">{healthScore}</span>
                  <span className="text-sm font-normal opacity-70">/ 100</span>
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Edit plant</h3>
              <div className="mt-3">
                <PlantForm plant={plant} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-ink p-6 text-black shadow-soft">
            <h2 className="text-xl font-semibold text-cream">Care history</h2>
            <div className="mt-4">
              <LogForm plantId={plant.id} />
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {logs.map((entry) => (
                <LogEntryCard key={entry.id} log={entry} />
              ))}
              {logs.length === 0 ? <p className="rounded-2xl bg-white/8 p-4 text-cream/70">No logs yet.</p> : null}
            </div>
          </div>
        </section>

        {/* Care activity chart */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">Care activity</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Log events per week over the last 12 weeks.</p>
          <div className="mt-4">
            <CareChart logs={logs} />
          </div>
        </section>

        {/* Photos */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">Photos</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track growth visually over time.</p>
          <div className="mt-4">
            <PhotoGallery plantId={plant.id} initialPhotos={photos} />
          </div>
        </section>

        {/* AI assistant */}
        <section className="rounded-[2rem] bg-white/75 p-6 shadow-soft dark:bg-white/5">
          <h2 className="text-xl font-semibold text-ink dark:text-cream">Ask the AI assistant</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Answers are generated using your plant&apos;s care history as context.
          </p>
          <div className="mt-4">
            <AiChat plantId={plant.id} />
          </div>
        </section>
      </div>
    </main>
  );
}
