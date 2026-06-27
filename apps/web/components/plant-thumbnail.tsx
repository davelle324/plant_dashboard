"use client";

type Props = {
  src: string;
  alt: string;
  className: string;
};

export function PlantThumbnail({ src, alt, className }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={`bg-slate-100 dark:bg-white/10 ${className}`}
      onError={(e) => {
        const img = e.currentTarget;
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23e2e8e0'/%3E%3C/svg%3E";
        img.onerror = null;
      }}
    />
  );
}
