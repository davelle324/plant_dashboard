export function formatDate(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatDateTime(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleString("en-US", {
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
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
