"use client";

import { useEffect, useState } from "react";

import { TIMEZONE_STORAGE_KEY } from "@/lib/use-timezone";

const TIMEZONES = [
  { group: "Americas", zones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "America/Vancouver", "America/Sao_Paulo", "America/Argentina/Buenos_Aires"] },
  { group: "Europe", zones: ["Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin", "Europe/Rome", "Europe/Madrid", "Europe/Amsterdam", "Europe/Stockholm", "Europe/Warsaw", "Europe/Athens", "Europe/Moscow"] },
  { group: "Asia & Pacific", zones: ["Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul", "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland"] },
  { group: "Other", zones: ["UTC"] },
];

export function SettingsTimezone() {
  const [tz, setTz] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    setTz(stored || Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  function onChange(value: string) {
    setTz(value);
    localStorage.setItem(TIMEZONE_STORAGE_KEY, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">
          Display timezone
        </label>
        <select
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-moss/30"
          value={tz}
          onChange={(e) => onChange(e.target.value)}
        >
          {TIMEZONES.map(({ group, zones }) => (
            <optgroup key={group} label={group}>
              {zones.map((z) => (
                <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className={`text-xs transition-opacity duration-500 ${saved ? "text-emerald-600 opacity-100" : "opacity-0"}`}>
        Saved — dates and times will display in this timezone.
      </p>
    </div>
  );
}
