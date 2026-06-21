"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { createPlant, updatePlant, type PlantInput } from "@/lib/api";
import type { Plant } from "@/lib/types";

type Props = {
  plant?: Plant;
};

const empty: PlantInput = {
  name: "",
  species: "",
  location: "",
  watering_interval_days: 7
};

export function PlantForm({ plant }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PlantInput>(
    plant
      ? {
          name: plant.name,
          species: plant.species,
          location: plant.location,
          watering_interval_days: plant.watering_interval_days
        }
      : empty
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (plant) {
          await updatePlant(plant.id, form);
        } else {
          await createPlant(form);
          setForm(empty);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <form className="space-y-3 rounded-2xl border border-black/5 bg-white/75 p-4" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-xl border border-black/10 bg-white px-3 py-2"
          placeholder="Plant name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-black/10 bg-white px-3 py-2"
          placeholder="Species"
          value={form.species}
          onChange={(event) => setForm((current) => ({ ...current, species: event.target.value }))}
          required
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <input
          className="rounded-xl border border-black/10 bg-white px-3 py-2"
          placeholder="Location"
          value={form.location}
          onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-black/10 bg-white px-3 py-2"
          type="number"
          min={1}
          max={365}
          value={form.watering_interval_days}
          onChange={(event) =>
            setForm((current) => ({ ...current, watering_interval_days: Number(event.target.value) }))
          }
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {plant ? "Save changes" : "Add plant"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}
