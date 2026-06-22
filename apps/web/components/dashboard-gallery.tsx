"use client";

import Link from "next/link";
import type { PhotoWithPlant } from "@/lib/types";

type Props = {
  photos: PhotoWithPlant[];
};

const PHOTO_BASE = "/api/uploads";

export function DashboardGallery({ photos }: Props) {
  if (photos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
        No photos uploaded yet. Add photos from any plant&apos;s detail page.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <Link
          key={photo.id}
          href={`/plant/${photo.plant_id}`}
          className="group relative aspect-square overflow-hidden rounded-2xl bg-black/5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${PHOTO_BASE}/${photo.plant_id}/${photo.filename}`}
            alt={photo.caption ?? photo.plant_name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />

          {/* Plant name strip — always visible at bottom */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
            <p className="truncate text-xs font-medium text-white">{photo.plant_name}</p>
          </div>

          {/* Caption overlay — appears on hover, above the plant name strip */}
          {photo.caption && (
            <div className="absolute inset-x-0 bottom-7 hidden bg-black/60 px-3 py-2 text-xs text-white/90 group-hover:block">
              {photo.caption}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
