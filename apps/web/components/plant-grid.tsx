"use client";

import { useState } from "react";
import { PlantActions } from "@/components/plant-actions";
import { PlantThumbnail } from "@/components/plant-thumbnail";
import { computeHealthScore, healthColor } from "@/lib/health";
import type { Plant, Reminder } from "@/lib/types";

type HealthFilter = "all" | "healthy" | "due-soon" | "overdue";

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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HealthFilter>("all");

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

  const FILTERS: { key: HealthFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "healthy", label: "Healthy" },
    { key: "due-soon", label: "Due soon" },
    { key: "overdue", label: "Overdue" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <input
          type="search"
          placeholder="Search by name, species, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-cream placeholder-cream/40 outline-none focus:border-fern dark:bg-white/5"
        />
        <div className="flex gap-2">
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plant) => {
          const reminder = reminderMap.get(plant.id);
          const due_in_days = reminder?.due_in_days ?? plant.watering_interval_days;
          const score = computeHealthScore(due_in_days, plant.watering_interval_days);
          const scoreClass = healthColor(score);

          return (
            <div key={plant.id} className="flex gap-3 rounded-2xl bg-white/8 p-4">
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
              <div className="min-w-0 flex-1">
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
    </div>
  );
}
