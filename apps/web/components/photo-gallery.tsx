"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deletePhoto, uploadPhoto } from "@/lib/api";
import type { Photo } from "@/lib/types";

type Props = {
  plantId: number;
  initialPhotos: Photo[];
};

const PHOTO_BASE = "/api/uploads";

export function PhotoGallery({ plantId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];

    startTransition(async () => {
      try {
        const photo = await uploadPhoto(plantId, file);
        setPhotos((prev) => [photo, ...prev]);
        toast.success("Photo uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  };

  const handleDelete = (photo: Photo) => {
    if (!confirm("Delete this photo?")) return;
    startTransition(async () => {
      try {
        await deletePhoto(photo.id);
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        toast.success("Photo deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream disabled:opacity-50"
        >
          {isPending ? "Uploading…" : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <span className="text-xs text-slate-400">JPG, PNG, WebP, GIF</span>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${PHOTO_BASE}/${photo.plant_id}/${photo.filename}`}
                alt="Plant photo"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(photo)}
                className="absolute right-2 top-2 hidden rounded-full bg-black/60 px-2 py-1 text-xs text-white group-hover:block"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-400">
          No photos yet. Upload one to start tracking growth.
        </p>
      )}
    </div>
  );
}
