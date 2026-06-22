"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
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
