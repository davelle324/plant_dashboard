"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Analytics } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  watering: "#3b82f6",
  fertilizing: "#f59e0b",
  pruning: "#10b981",
  notes: "#94a3b8",
};

type Props = { analytics: Analytics };

export function ActivityChart({ analytics }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={analytics.activity_by_week} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#2f5d50" radius={[4, 4, 0, 0]} name="Care events" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PLANT_COLORS = ["#2f5d50", "#7aa36d", "#3b82f6", "#f59e0b", "#a855f7"];

export function WateringTrendsChart({ analytics }: Props) {
  const plants = analytics.plant_stats
    .filter((p) => p.watering_intervals.length > 0)
    .slice(0, 5);

  if (plants.length === 0) {
    return <p className="text-sm text-slate-400">Not enough watering data yet (need at least 2 waterings per plant).</p>;
  }

  // Collect all unique dates across all plants, sorted
  const allDates = Array.from(
    new Set(plants.flatMap((p) => p.watering_intervals.map((i) => i.date)))
  ).sort();

  // Build rows: { date, [plant_name]: days }
  const rows = allDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const plant of plants) {
      const interval = plant.watering_intervals.find((i) => i.date === date);
      if (interval) row[plant.plant_name] = interval.days;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="d" />
        <Tooltip formatter={(v) => [`${v} days`, ""]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {plants.map((plant, i) => (
          <Line
            key={plant.plant_id}
            type="monotone"
            dataKey={plant.plant_name}
            stroke={PLANT_COLORS[i % PLANT_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TypeBreakdownChart({ analytics }: Props) {
  const data = Object.entries(analytics.logs_by_type)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No logs yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={TYPE_COLORS[entry.name] ?? "#cbd5e1"} />
          ))}
        </Pie>
        <Tooltip formatter={(v, name) => [`${v} events`, name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
