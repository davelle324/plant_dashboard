"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { createPlant, updatePlant, type PlantInput } from "@/lib/api";
import { getPlantDefaults } from "@/components/settings-defaults";
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
      ? { name: plant.name, species: plant.species, location: plant.location, watering_interval_days: plant.watering_interval_days }
      : empty
  );

  // Pre-fill from saved defaults when creating a new plant
  useEffect(() => {
    if (!plant) {
      const d = getPlantDefaults();
      setForm((prev) => ({
        ...prev,
        location: d.location || prev.location,
        watering_interval_days: d.watering_interval_days,
      }));
    }
  }, [plant]);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        if (plant) {
          await updatePlant(plant.id, form);
          toast.success("Plant updated");
        } else {
          await createPlant(form);
          setForm(empty);
          toast.success("Plant added");
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
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
      </div>
    </form>
  );
}
