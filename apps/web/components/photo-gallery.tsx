"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deletePhoto, updatePhotoCaption, uploadPhoto } from "@/lib/api";
import type { Photo } from "@/lib/types";

type Props = {
  plantId: number;
  initialPhotos: Photo[];
};

const PHOTO_BASE = "/api/uploads";

function PhotoCard({
  photo,
  onDelete,
  onCaptionSave,
}: {
  photo: Photo;
  onDelete: () => void;
  onCaptionSave: (caption: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(photo.caption ?? "");
  const [isSaving, startSaving] = useTransition();

  function startEdit() {
    setDraft(photo.caption ?? "");
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft(photo.caption ?? "");
  }

  function save() {
    startSaving(async () => {
      try {
        await onCaptionSave(draft.trim() || null);
        setEditing(false);
      } catch {
        toast.error("Failed to save caption");
      }
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${PHOTO_BASE}/${photo.plant_id}/${photo.filename}`}
        alt={photo.caption ?? "Plant photo"}
        className="aspect-square w-full object-cover"
      />

      {/* Delete button — always visible on touch screens, hover-only on desktop */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white sm:hidden sm:group-hover:block"
      >
        Delete
      </button>

      {/* Caption area */}
      <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-black/60 px-3 py-2">
        {editing ? (
          <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              placeholder="Add a caption…"
              className="w-full rounded-lg bg-white/20 px-2 py-1 text-xs text-white placeholder-white/60 outline-none focus:bg-white/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={save}
                className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-white/35 disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="rounded-full px-2.5 py-0.5 text-xs text-white/70 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-full text-left"
          >
            {photo.caption ? (
              <span className="block text-xs text-white">{photo.caption}</span>
            ) : (
              <span className="block text-xs text-white/50 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                Add caption…
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function PhotoGallery({ plantId, initialPhotos }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files?.length) return;
    startTransition(async () => {
      try {
        const photo = await uploadPhoto(plantId, files[0]);
        setPhotos((prev) => [photo, ...prev]);
        toast.success("Photo uploaded — click it to add a caption");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        // Reset so the same file can be re-selected if needed
        if (inputRef.current) inputRef.current.value = "";
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

  const handleCaptionSave = async (photo: Photo, caption: string | null) => {
    const updated = await updatePhotoCaption(photo.id, caption);
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
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
        <span className="text-xs text-slate-400">JPG, PNG, WebP, GIF · captions can be added after upload</span>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={() => handleDelete(photo)}
              onCaptionSave={(caption) => handleCaptionSave(photo, caption)}
            />
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
