"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createLog } from "@/lib/api";
import type { Plant } from "@/lib/types";

type CareType = "watering" | "fertilizing" | "pruning" | "notes";

const CARE_TYPES: { value: CareType; label: string; icon: string }[] = [
  { value: "watering",    label: "Water",     icon: "💧" },
  { value: "fertilizing", label: "Fertilize", icon: "🌿" },
  { value: "pruning",     label: "Prune",     icon: "✂️" },
  { value: "notes",       label: "Note",      icon: "📝" },
];

export function QuickCareForm({ plants }: { plants: Plant[] }) {
  const router = useRouter();
  const [plantId, setPlantId] = useState<number | "">(plants[0]?.id ?? "");
  const [careType, setCareType] = useState<CareType>("watering");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!plantId) return;
    startTransition(async () => {
      try {
        await createLog({ plant_id: plantId, type: careType, note: note.trim() || undefined });
        toast.success("Care logged");
        setNote("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to log care");
      }
    });
  }

  if (plants.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
      <h2 className="text-xl font-semibold text-ink dark:text-cream">Log care</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quickly record what you just did.</p>

      <div className="mt-4 flex flex-col gap-4">
        {/* Plant selector */}
        <select
          value={plantId}
          onChange={(e) => setPlantId(Number(e.target.value))}
          className="w-full rounded-2xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-moss/40 dark:border-white/10 dark:bg-zinc-800 dark:text-cream dark:[color-scheme:dark]"
        >
          {plants.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Care type buttons */}
        <div className="flex flex-wrap gap-2">
          {CARE_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => setCareType(ct.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                careType === ct.value
                  ? "bg-ink text-cream dark:bg-fern dark:text-ink"
                  : "border border-black/10 text-ink hover:bg-black/5 dark:border-white/15 dark:text-cream dark:hover:bg-white/10"
              }`}
            >
              <span>{ct.icon}</span>
              {ct.label}
            </button>
          ))}
        </div>

        {/* Note input */}
        <input
          type="text"
          placeholder={careType === "notes" ? "What did you observe?" : "Add a note (optional)"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="w-full rounded-2xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-moss/40 dark:border-white/10 dark:bg-white/10 dark:text-cream"
        />

        <button
          type="button"
          disabled={!plantId || isPending}
          onClick={submit}
          className="self-start rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-px disabled:opacity-50 dark:bg-fern dark:text-ink"
        >
          {isPending ? "Logging…" : "Log it"}
        </button>
      </div>
    </section>
  );
}
