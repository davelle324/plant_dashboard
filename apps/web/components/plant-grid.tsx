"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createLog, deletePlant } from "@/lib/api";
import { PlantActions } from "@/components/plant-actions";
import { PlantThumbnail } from "@/components/plant-thumbnail";
import { computeHealthScore, healthColor } from "@/lib/health";
import type { Plant, Reminder } from "@/lib/types";

type HealthFilter = "all" | "healthy" | "due-soon" | "overdue";

const PAGE_SIZE = 12;

function getHealthTier(plant: Plant, reminder: Reminder | undefined): HealthFilter {
  if (!reminder) return "healthy";
  const { due_in_days } = reminder;
  if (due_in_days <= 0) return "overdue";
  if (due_in_days <= plant.watering_interval_days * 0.25) return "due-soon";
  return "healthy";
}

type Props = {
  plants: Plant[];
  reminders: Reminder[];
};

export function PlantGrid({ plants, reminders }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HealthFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Reset pagination and selection whenever search/filter changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelected(new Set());
  }, [query, filter]);

  const reminderMap = new Map(reminders.map((r) => [r.plant_id, r]));

  const filtered = plants.filter((plant) => {
    if (query) {
      const q = query.toLowerCase();
      const match =
        plant.name.toLowerCase().includes(q) ||
        plant.species.toLowerCase().includes(q) ||
        plant.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filter !== "all") {
      const tier = getHealthTier(plant, reminderMap.get(plant.id));
      if (tier !== filter) return false;
    }
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((p) => p.id)));
    }
  }

  function bulkAction(action: "watering" | "fertilizing" | "delete") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    if (action === "delete") {
      if (!confirm(`Delete ${ids.length} plant${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    }

    startTransition(async () => {
      try {
        if (action === "delete") {
          await Promise.all(ids.map((id) => deletePlant(id)));
          toast.success(`Deleted ${ids.length} plant${ids.length === 1 ? "" : "s"}`);
        } else {
          await Promise.all(ids.map((id) => createLog({ plant_id: id, type: action })));
          const label = action === "watering" ? "Watered" : "Fertilized";
          toast.success(`${label} ${ids.length} plant${ids.length === 1 ? "" : "s"}`);
        }
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const FILTERS: { key: HealthFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "healthy", label: "Healthy" },
    { key: "due-soon", label: "Due soon" },
    { key: "overdue", label: "Overdue" },
  ];

  return (
    <div>
      {/* Search + filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <input
          type="search"
          placeholder="Search by name, species, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-cream placeholder-cream/40 outline-none focus:border-fern dark:bg-white/5"
        />
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f.key
                  ? "bg-fern text-ink"
                  : "bg-white/10 text-cream/70 hover:bg-white/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count + select-all row */}
      {filtered.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-cream/50">
          <span>
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}
          </span>
          <button
            onClick={toggleSelectAll}
            className="underline underline-offset-2 hover:text-cream/80"
          >
            {allVisibleSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      {/* Plant cards */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((plant) => {
          const reminder = reminderMap.get(plant.id);
          const due_in_days = reminder?.due_in_days ?? plant.watering_interval_days;
          const score = computeHealthScore(due_in_days, plant.watering_interval_days);
          const scoreClass = healthColor(score);
          const isSelected = selected.has(plant.id);

          return (
            <div
              key={plant.id}
              className={`relative flex gap-3 rounded-2xl p-4 transition ${
                isSelected ? "bg-fern/20 ring-1 ring-fern" : "bg-white/8"
              }`}
            >
              {/* Selection checkbox — top-right corner */}
              <input
                type="checkbox"
                aria-label={`Select ${plant.name}`}
                checked={isSelected}
                onChange={() => toggleSelect(plant.id)}
                className="absolute right-3 top-3 h-4 w-4 cursor-pointer accent-fern"
              />

              {plant.latest_photo ? (
                <PlantThumbnail
                  src={`/api/uploads/${plant.id}/${plant.latest_photo.filename}`}
                  alt={plant.name}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                  🌿
                </div>
              )}
              <div className="min-w-0 flex-1 pr-5">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-cream">{plant.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreClass}`}>
                    {score}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-cream/70">
                  {plant.species} · {plant.location}
                </p>
                <div className="mt-2">
                  <PlantActions plant={plant} />
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <p className="rounded-2xl bg-white/8 p-4 text-sm text-cream/70">
            {plants.length === 0 ? "No plants yet." : "No plants match your search."}
          </p>
        ) : null}
      </div>

      {/* Load more */}
      {filtered.length > visibleCount && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-cream hover:bg-white/20"
          >
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Floating bulk-action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-ink px-5 py-3 shadow-soft ring-1 ring-white/10">
          <span className="text-sm font-medium text-cream/70">
            {selected.size} selected
          </span>
          <div className="mx-1 h-4 w-px bg-white/20" />
          <button
            disabled={isPending}
            onClick={() => bulkAction("watering")}
            className="rounded-full bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            💧 Water
          </button>
          <button
            disabled={isPending}
            onClick={() => bulkAction("fertilizing")}
            className="rounded-full bg-amber-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            🌱 Fertilize
          </button>
          <button
            disabled={isPending}
            onClick={() => bulkAction("delete")}
            className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-1 text-cream/40 hover:text-cream/80"
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
