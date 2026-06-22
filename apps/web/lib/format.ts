// API timestamps are UTC but stored without the Z suffix (naive datetime in SQLAlchemy).
// Browsers parse bare ISO strings (no Z/offset) as local time, so we must append Z.
function parseUtc(iso: string): Date {
  return new Date(/[Z+]/.test(iso) ? iso : iso + "Z");
}

export function formatDate(iso: string, timeZone?: string): string {
  return parseUtc(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatDateTime(iso: string, timeZone?: string): string {
  return parseUtc(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
}

/** Convert an ISO string to the value format expected by <input type="datetime-local"> */
export function toDateTimeInputValue(iso: string): string {
  const d = parseUtc(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
