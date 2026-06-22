"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";

import { createLog } from "@/lib/api";

type Props = { plantId: number; plantName: string };

export function QuickWaterButton({ plantId, plantName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [watered, setWatered] = useState(false);

  if (watered) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        Watered
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-cream transition hover:bg-moss disabled:opacity-60"
      onClick={() => {
        startTransition(async () => {
          try {
            await createLog({ plant_id: plantId, type: "watering" });
            setWatered(true);
            toast.success(`${plantName} marked as watered`);
            router.refresh();
          } catch {
            toast.error("Failed to log watering");
          }
        });
      }}
    >
      {isPending ? "Saving…" : "Water now"}
    </button>
  );
}
