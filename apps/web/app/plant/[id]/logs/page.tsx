import { getPlantLogs } from "@/lib/api";
import { formatDate } from "@/lib/format";

type PlantLogsPageProps = {
  params: { id: string };
};

export default async function PlantLogsPage({ params }: PlantLogsPageProps) {
  const { id } = params;
  const logs = await getPlantLogs(id);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-8 md:px-10">
      <p className="text-sm uppercase tracking-[0.3em] text-moss">Logs</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Plant #{id} history</h1>
      <div className="mt-8 rounded-[2rem] bg-white/75 p-6 shadow-soft">
        <div className="space-y-4">
          {logs.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-black/5 bg-cream p-4">
              <p className="font-medium text-ink">{entry.type}</p>
              <p className="mt-1 text-sm text-slate-600">
                {entry.note ?? "No note"} · {formatDate(entry.created_at)}
              </p>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-sm text-slate-500">No logs yet.</p> : null}
        </div>
      </div>
    </main>
  );
}
