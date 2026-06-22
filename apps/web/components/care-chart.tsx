"use client";

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LogEntry } from "@/lib/types";

type Props = { logs: LogEntry[] };

const COLORS = {
  watering: "#3b82f6",
  fertilizing: "#f59e0b",
  pruning: "#10b981",
  notes: "#94a3b8",
};

function buildWeeks(logs: LogEntry[], count = 12) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Align to Monday of current week
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  thisMonday.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, i) => {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - (count - 1 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekLogs = logs.filter((l) => {
      const d = new Date(l.created_at);
      return d >= weekStart && d < weekEnd;
    });

    return {
      week: label,
      watering: weekLogs.filter((l) => l.type === "watering").length,
      fertilizing: weekLogs.filter((l) => l.type === "fertilizing").length,
      pruning: weekLogs.filter((l) => l.type === "pruning").length,
      notes: weekLogs.filter((l) => l.type === "notes").length,
    };
  });
}

export function CareChart({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No care logs yet — add some to see the chart.
      </p>
    );
  }

  const data = buildWeeks(logs);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="watering" stackId="a" fill={COLORS.watering} />
        <Bar dataKey="fertilizing" stackId="a" fill={COLORS.fertilizing} />
        <Bar dataKey="pruning" stackId="a" fill={COLORS.pruning} />
        <Bar dataKey="notes" stackId="a" fill={COLORS.notes} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
