"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deletePlant } from "@/lib/api";

type Props = {
  plantId: number;
  plantName: string;
};

export function DeletePlantButton({ plantId, plantName }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  function handleDelete() {
    if (!confirm(`Delete ${plantName}? This cannot be undone.`)) return;
    setIsPending(true);
    deletePlant(plantId)
      .then(() => {
        toast.success(`${plantName} deleted`);
        router.push("/dashboard");
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Delete failed");
        setIsPending(false);
      });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="mt-4 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60"
    >
      {isPending ? "Deleting…" : "Delete plant"}
    </button>
  );
}
