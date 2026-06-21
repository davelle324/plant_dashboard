"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deletePlant } from "@/lib/api";
import type { Plant } from "@/lib/types";

type Props = {
  plant: Plant;
};

export function PlantActions({ plant }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/plant/${plant.id}/logs`}
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink"
      >
        View logs
      </Link>
      <Link
        href={`/plant/${plant.id}`}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-cream"
      >
        Edit
      </Link>
      <button
        className="rounded-full bg-rose-100 px-4 py-2 text-sm font-medium text-rose-800 disabled:opacity-60"
        disabled={isPending}
        type="button"
        onClick={() => {
          if (!confirm(`Delete ${plant.name}?`)) {
            return;
          }
          startTransition(async () => {
            await deletePlant(plant.id);
            router.refresh();
          });
        }}
      >
        Delete
      </button>
    </div>
  );
}
