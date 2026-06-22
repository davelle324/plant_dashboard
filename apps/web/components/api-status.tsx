"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "ok" | "error";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((r) => setStatus(r.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "checking") {
    return <span className="text-xs text-slate-400">Checking…</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>
      <span className={`h-2 w-2 rounded-full ${status === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
      {status === "ok" ? "Connected" : "Unreachable"}
    </span>
  );
}
