export function computeHealthScore(due_in_days: number, watering_interval_days: number): number {
  if (watering_interval_days <= 0) return 50;
  const raw = 50 + (due_in_days / watering_interval_days) * 50;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function healthColor(score: number): string {
  if (score >= 70) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (score >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300";
}
