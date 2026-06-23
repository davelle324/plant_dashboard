import Link from "next/link";

import { getPlantLogs } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { NavAccount } from "@/components/nav-account";
import { ThemeToggle } from "@/components/theme-toggle";

type PlantLogsPageProps = {
  params: { id: string };
};

export default async function PlantLogsPage({ params }: PlantLogsPageProps) {
  const { id } = params;
  const logs = await getPlantLogs(id);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <Link
          href={`/plant/${id}`}
          className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-sm font-medium text-ink transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-cream dark:hover:bg-white/10"
        >
          ← Plant detail
        </Link>
        <NavAccount />
        <ThemeToggle />
      </div>
      <p className="mt-4 text-sm uppercase tracking-[0.3em] text-moss dark:text-fern">Logs</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">Plant #{id} history</h1>
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
