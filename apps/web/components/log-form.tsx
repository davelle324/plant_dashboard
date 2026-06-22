"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { createLog, updateLog, type LogInput } from "@/lib/api";
import { toDateTimeInputValue } from "@/lib/format";
import type { LogEntry } from "@/lib/types";

type Props = {
  plantId?: number;
  log?: LogEntry;
};

function nowInputValue() {
  return toDateTimeInputValue(new Date().toISOString());
}

export function LogForm({ plantId, log }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<LogEntry["type"]>(log?.type ?? "watering");
  const [note, setNote] = useState(log?.note ?? "");
  const [datetime, setDatetime] = useState(
    log ? toDateTimeInputValue(log.created_at) : nowInputValue()
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        const plantIdValue = log?.plant_id ?? plantId;
        if (plantIdValue === undefined) throw new Error("plant_id is required");

        const payload: LogInput = {
          plant_id: plantIdValue,
          type,
          note: note.trim() || undefined,
          created_at: new Date(datetime).toISOString(),
        };

        if (log) {
          await updateLog(log.id, payload);
          toast.success("Log updated");
        } else {
          await createLog(payload);
          setNote("");
          setDatetime(nowInputValue());
          toast.success("Log added");
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <form className="space-y-3 rounded-2xl border border-black/5 bg-white/75 p-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <select
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as LogEntry["type"])}
        >
          <option value="watering">Watering</option>
          <option value="pruning">Pruning</option>
          <option value="fertilizing">Fertilizing</option>
          <option value="notes">Notes</option>
        </select>
        <input
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Date &amp; time</label>
        <input
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          className="rounded-full bg-moss px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {log ? "Save log" : "Add log"}
        </button>
      </div>
    </form>
  );
}
