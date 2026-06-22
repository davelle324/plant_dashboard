import Link from "next/link";

import { getAnalytics } from "@/lib/api";
import { ActivityChart, TypeBreakdownChart } from "@/components/analytics-charts";
import type { PlantStat } from "@/lib/types";

export default async function AnalyticsPage() {
  let analytics;
  try {
    analytics = await getAnalytics();
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-8 md:px-10">
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Usage analytics</h1>
        <p className="mt-8 text-slate-500">Could not load analytics. Make sure the API is running.</p>
      </main>
    );
  }

  const mostActive = analytics.plant_stats[0] ?? null;
  const mostNeglected = analytics.plant_stats
    .filter((p) => p.days_since_last_watered !== null)
    .sort((a, b) => (b.days_since_last_watered ?? 0) - (a.days_since_last_watered ?? 0))[0] ?? null;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Usage analytics</h1>
        </div>
        <Link href="/dashboard" className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-sm font-medium text-ink transition hover:bg-white">
          ← Dashboard
        </Link>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Plants tracked", value: analytics.total_plants },
          { label: "Total care events", value: analytics.total_logs },
          { label: "Photos uploaded", value: analytics.total_photos },
        ].map((s) => (
          <article key={s.label} className="rounded-3xl border border-black/5 bg-white/75 p-6 shadow-soft">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-3 text-4xl font-semibold text-ink">{s.value}</p>
          </article>
        ))}
      </section>

      {/* ── Highlights ─────────────────────────────────────────────────── */}
      {(mostActive || mostNeglected) && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {mostActive && (
            <div className="rounded-[2rem] bg-emerald-50 border border-emerald-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Most active</p>
              <p className="mt-2 text-xl font-semibold text-ink">{mostActive.plant_name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {mostActive.total_logs} care event{mostActive.total_logs !== 1 ? "s" : ""} · {mostActive.watering_count} watering{mostActive.watering_count !== 1 ? "s" : ""}
              </p>
            </div>
          )}
          {mostNeglected && mostNeglected.days_since_last_watered !== null && mostNeglected.days_since_last_watered > 0 && (
            <div className="rounded-[2rem] bg-amber-50 border border-amber-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Longest since watered</p>
              <p className="mt-2 text-xl font-semibold text-ink">{mostNeglected.plant_name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {mostNeglected.days_since_last_watered} day{mostNeglected.days_since_last_watered !== 1 ? "s" : ""} since last watering
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Care events per week</h2>
          <p className="mt-1 text-sm text-slate-500">All plants, last 12 weeks.</p>
          <div className="mt-4">
            <ActivityChart analytics={analytics} />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Care type breakdown</h2>
          <p className="mt-1 text-sm text-slate-500">All-time distribution across log types.</p>
          <div className="mt-4">
            <TypeBreakdownChart analytics={analytics} />
          </div>
        </div>
      </section>

      {/* ── Per-plant table ────────────────────────────────────────────── */}
      {analytics.plant_stats.length > 0 && (
        <section className="mt-6 rounded-[2rem] bg-white/75 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Per-plant breakdown</h2>
          <p className="mt-1 text-sm text-slate-500">Sorted by total care events.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Plant</th>
                  <th className="pb-3 pr-4 text-right">Events</th>
                  <th className="pb-3 pr-4 text-right">Waterings</th>
                  <th className="pb-3 pr-4 text-right">Days since watered</th>
                  <th className="pb-3 text-right">Avg days between</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {analytics.plant_stats.map((p) => (
                  <PlantStatRow key={p.plant_id} stat={p} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {analytics.total_plants === 0 && (
        <div className="mt-12 text-center">
          <p className="text-slate-400">No data yet. Add some plants and start logging care events.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-moss underline underline-offset-2">
            Go to dashboard →
          </Link>
        </div>
      )}
    </main>
  );
}

function PlantStatRow({ stat }: { stat: PlantStat }) {
  return (
    <tr className="text-ink">
      <td className="py-3 pr-4 font-medium">
        <Link href={`/plant/${stat.plant_id}`} className="hover:text-moss hover:underline underline-offset-2">
          {stat.plant_name}
        </Link>
      </td>
      <td className="py-3 pr-4 text-right">{stat.total_logs}</td>
      <td className="py-3 pr-4 text-right">{stat.watering_count}</td>
      <td className="py-3 pr-4 text-right">
        {stat.days_since_last_watered === null ? (
          <span className="text-slate-400">—</span>
        ) : (
          <span className={stat.days_since_last_watered > 7 ? "text-rose-600" : "text-ink"}>
            {stat.days_since_last_watered}d
          </span>
        )}
      </td>
      <td className="py-3 text-right">
        {stat.avg_days_between_waterings === null ? (
          <span className="text-slate-400">—</span>
        ) : (
          `${stat.avg_days_between_waterings}d`
        )}
      </td>
    </tr>
  );
}
