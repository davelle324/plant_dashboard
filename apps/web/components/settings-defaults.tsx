"use client";

import { useEffect, useState } from "react";

export type PlantDefaults = {
  location: string;
  watering_interval_days: number;
};

const STORAGE_KEY = "plantDefaults";

export function getPlantDefaults(): PlantDefaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { location: "", watering_interval_days: 7, ...JSON.parse(raw) };
  } catch {}
  return { location: "", watering_interval_days: 7 };
}

export function SettingsDefaults() {
  const [defaults, setDefaults] = useState<PlantDefaults>({ location: "", watering_interval_days: 7 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDefaults(getPlantDefaults());
  }, []);

  function update(patch: Partial<PlantDefaults>) {
    const next = { ...defaults, ...patch };
    setDefaults(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Default location
          </label>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss/30"
            placeholder="e.g. Kitchen windowsill"
            value={defaults.location}
            onChange={(e) => update({ location: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Default watering interval (days)
          </label>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-moss/30"
            type="number"
            min={1}
            max={365}
            value={defaults.watering_interval_days}
            onChange={(e) => update({ watering_interval_days: Number(e.target.value) })}
          />
        </div>
      </div>
      <p className={`text-xs transition-opacity duration-500 ${saved ? "text-emerald-600 opacity-100" : "opacity-0"}`}>
        Saved — these will pre-fill the add plant form.
      </p>
    </div>
  );
}
