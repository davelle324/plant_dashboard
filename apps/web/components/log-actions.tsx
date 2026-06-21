"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteLog } from "@/lib/api";
import type { LogEntry } from "@/lib/types";

type Props = {
  log: LogEntry;
};

export function LogActions({ log }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cream disabled:opacity-60"
      disabled={isPending}
      type="button"
      onClick={() => {
        if (!confirm("Delete this log entry?")) {
          return;
        }
        startTransition(async () => {
          await deleteLog(log.id);
          router.refresh();
        });
      }}
    >
      Delete
    </button>
  );
}

