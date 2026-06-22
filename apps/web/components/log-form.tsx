"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { createLog, updateLog, type LogInput } from "@/lib/api";
import type { LogEntry } from "@/lib/types";

type Props = {
  plantId?: number;
  log?: LogEntry;
};

const empty: Omit<LogInput, "plant_id"> = {
  type: "watering",
  note: ""
};

export function LogForm({ plantId, log }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Omit<LogInput, "plant_id">>(
    log ? { type: log.type, note: log.note ?? "" } : empty
  );
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        const plantIdValue = log?.plant_id ?? plantId;
        if (plantIdValue === undefined) throw new Error("plant_id is required");

        const payload = { plant_id: plantIdValue, type: form.type, note: form.note?.trim() || undefined };

        if (log) {
          await updateLog(log.id, payload);
          toast.success("Log updated");
        } else {
          await createLog(payload);
          setForm(empty);
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
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <select
          className="rounded-xl border border-black/10 bg-white px-3 py-2"
          value={form.type}
          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as LogInput["type"] }))}
        >
          <option value="watering">watering</option>
          <option value="pruning">pruning</option>
          <option value="fertilizing">fertilizing</option>
          <option value="notes">notes</option>
        </select>
        <input
          className="rounded-xl border border-black/10 bg-white px-3 py-2"
          placeholder="Optional note"
          value={form.note}
          onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
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
