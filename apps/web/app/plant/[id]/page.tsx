import { getPlant, getPlantLogs } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { LogEntryCard } from "@/components/log-entry-card";
import { LogForm } from "@/components/log-form";
import { PlantForm } from "@/components/plant-form";

type PlantPageProps = {
  params: { id: string };
};

export default async function PlantDetailPage({ params }: PlantPageProps) {
  const { id } = params;
  const [plant, logs] = await Promise.all([getPlant(id), getPlantLogs(id)]);
  const lastWatering = logs.find((l) => l.type === "watering");
  const lastCare = lastWatering?.created_at ?? logs[0]?.created_at ?? plant.created_at;
  const daysSinceLastCare = Math.max(
    Math.floor((Date.now() - new Date(lastCare).getTime()) / 86_400_000),
    0
  );
  const healthStatus =
    daysSinceLastCare > plant.watering_interval_days
      ? { label: "Overdue", style: "bg-red-100 text-red-800" }
      : daysSinceLastCare >= plant.watering_interval_days * 0.75
        ? { label: "Due soon", style: "bg-amber-100 text-amber-800" }
        : { label: "Healthy", style: "bg-emerald-100 text-emerald-800" };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8 md:px-10">
      <p className="text-sm uppercase tracking-[0.3em] text-moss">Plant detail</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">{plant.name}</h1>
      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">Health summary</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Last watered</dt>
              <dd className="mt-1 font-medium text-ink">{formatDate(lastCare)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Days since last care</dt>
              <dd className="mt-1 font-medium text-ink">{daysSinceLastCare}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Indicator</dt>
              <dd className={`mt-1 inline-flex rounded-full px-3 py-1 font-medium ${healthStatus.style}`}>
                {healthStatus.label}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Edit plant</h3>
            <div className="mt-3">
              <PlantForm plant={plant} />
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] bg-ink p-6 text-black shadow-soft">
          <h2 className="text-xl font-semibold">Care history</h2>
          <div className="mt-4">
            <LogForm plantId={plant.id} />
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {logs.map((entry) => (
              <LogEntryCard key={entry.id} log={entry} />
            ))}
            {logs.length === 0 ? <p className="rounded-2xl bg-white/8 p-4">No logs yet.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
