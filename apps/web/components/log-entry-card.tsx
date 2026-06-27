"use client";

import { useState } from "react";

import { formatDateTime } from "@/lib/format";
import { useTimezone } from "@/lib/use-timezone";
import type { LogEntry } from "@/lib/types";

import { LogActions } from "./log-actions";
import { LogForm } from "./log-form";

type Props = {
  log: LogEntry;
};

const LOG_TYPE_META: Record<string, { icon: string; className: string }> = {
  watering:    { icon: "💧", className: "bg-blue-500/25 text-blue-200" },
  fertilizing: { icon: "🌱", className: "bg-amber-500/25 text-amber-200" },
  pruning:     { icon: "✂️", className: "bg-rose-500/25 text-rose-200" },
  notes:       { icon: "📝", className: "bg-slate-500/25 text-slate-300" },
};

export function LogEntryCard({ log }: Props) {
  const [editing, setEditing] = useState(false);
  const tz = useTimezone();
  const meta = LOG_TYPE_META[log.type] ?? { icon: "📋", className: "bg-slate-500/25 text-slate-300" };

  if (editing) {
    return (
      <div className="rounded-2xl bg-white/8 p-4">
        <LogForm log={log} />
        <button className="mt-3 text-xs text-cream/70 underline" type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/8 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${meta.className}`}>
              {meta.icon} {log.type}
            </span>
            {log.note && (
              <span className="text-sm text-cream/90">{log.note}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cream"
            type="button"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <LogActions log={log} />
        </div>
      </div>
      <p className="mt-2 text-sm text-cream/70">{tz ? formatDateTime(log.created_at, tz) : formatDateTime(log.created_at)}</p>
    </div>
  );
}
