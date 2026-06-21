"use client";

import { useState } from "react";

import type { LogEntry } from "@/lib/types";

import { LogActions } from "./log-actions";
import { LogForm } from "./log-form";

type Props = {
  log: LogEntry;
};

export function LogEntryCard({ log }: Props) {
  const [editing, setEditing] = useState(false);

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
        <p className="font-medium">
          {log.type}
          {log.note ? `: ${log.note}` : ""}
        </p>
        <div className="flex items-center gap-2">
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
      <p className="mt-2 text-cream/70">{log.created_at}</p>
    </div>
  );
}
