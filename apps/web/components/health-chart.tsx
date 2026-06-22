"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = { total: number; overdue: number };

const COLORS = {
  healthy: "#10b981",
  overdue: "#f43f5e",
  empty: "#e2e8f0",
};

export function HealthChart({ total, overdue }: Props) {
  if (total === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <p className="text-sm text-slate-500">No plants tracked yet.</p>
      </div>
    );
  }

  const healthy = Math.max(total - overdue, 0);

  const data =
    healthy === 0 && overdue === 0
      ? [{ name: "Empty", value: 1, color: COLORS.empty }]
      : [
          { name: "Healthy", value: healthy, color: COLORS.healthy },
          { name: "Overdue", value: overdue, color: COLORS.overdue },
        ];

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={healthy > 0 && overdue > 0 ? 3 : 0}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [`${v} plants`, name]} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Healthy</span>
          <span className="ml-auto font-semibold text-ink dark:text-white">{healthy}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-slate-600">Overdue</span>
          <span className="ml-auto font-semibold text-ink dark:text-white">{overdue}</span>
        </div>
        <div className="flex items-center gap-2 border-t border-black/5 pt-3">
          <span className="text-slate-500">Total</span>
          <span className="ml-auto font-semibold text-ink dark:text-white">{total}</span>
        </div>
      </div>
    </div>
  );
}
