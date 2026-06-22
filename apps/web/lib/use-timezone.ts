"use client";

import { useEffect, useState } from "react";

export const TIMEZONE_STORAGE_KEY = "preferredTimezone";

export function useTimezone(): string {
  const [tz, setTz] = useState("");
  useEffect(() => {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    setTz(stored || Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  return tz;
}
