"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const [captionInput, setCaptionInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const caption = captionInput.trim() || undefined;

    startTransition(async () => {
      try {
        const photo = await uploadPhoto(plantId, file, caption);
        setPhotos((prev) => [photo, ...prev]);
        setCaptionInput("");
        toast.success("Photo uploaded");
        router.refresh();
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
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream disabled:opacity-50 dark:bg-fern dark:text-ink"
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
        <input
          type="text"
          placeholder="Caption (optional)"
          value={captionInput}
          onChange={(e) => setCaptionInput(e.target.value)}
          maxLength={500}
          disabled={isPending}
          className="flex-1 rounded-full border border-black/10 bg-transparent px-4 py-2 text-sm text-ink placeholder-slate-400 outline-none focus:border-moss disabled:opacity-50 dark:border-white/10 dark:text-cream dark:placeholder-slate-500 dark:focus:border-fern"
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
                alt={photo.caption ?? "Plant photo"}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(photo)}
                className="absolute right-2 top-2 hidden rounded-full bg-black/60 px-2 py-1 text-xs text-white group-hover:block"
              >
                Delete
              </button>
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 hidden rounded-b-2xl bg-black/60 px-3 py-2 text-xs text-white group-hover:block">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-slate-400 dark:border-white/10">
          No photos yet. Upload one to start tracking growth.
        </p>
      )}
    </div>
  );
}
