import Link from "next/link";
import { notFound } from "next/navigation";

import { getUserGallery, getUserProfile } from "@/lib/api";
import { FollowButton } from "@/components/follow-button";
import { PlantThumbnail } from "@/components/plant-thumbnail";
import { NavAccount } from "@/components/nav-account";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PhotoWithPlant, PublicUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  let profile: PublicUser;
  let gallery: PhotoWithPlant[] = [];
  try {
    [profile, gallery] = await Promise.all([
      getUserProfile(params.userId),
      getUserGallery(params.userId).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/people" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
          ← All people
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <NavAccount />
          <ThemeToggle />
          <Link href="/" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
            Back home
          </Link>
        </div>
      </div>

      {/* Profile header */}
      <header className="mt-8 flex flex-col items-start gap-5 rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-soft dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-fern/30 text-4xl">
          🌱
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-ink dark:text-cream">{profile.display_name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span>
              <strong className="text-ink dark:text-cream">{profile.plant_count}</strong> plants
            </span>
            <span>
              <strong className="text-ink dark:text-cream">{profile.photo_count}</strong> photos
            </span>
            <span>
              <strong className="text-ink dark:text-cream">{profile.follower_count}</strong> followers
            </span>
            <span>
              <strong className="text-ink dark:text-cream">{profile.following_count}</strong> following
            </span>
          </div>
        </div>
        {!profile.is_self && (
          <FollowButton
            userId={profile.id}
            displayName={profile.display_name}
            initialFollowing={profile.is_following}
          />
        )}
      </header>

      {/* Gallery */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink dark:text-cream">Gallery</h2>
        {gallery.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-slate-500 dark:border-white/10">
            {profile.display_name} hasn&apos;t shared any photos yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((photo) => (
              <figure
                key={photo.id}
                className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/70 shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <PlantThumbnail
                  src={`/api/uploads/${photo.plant_id}/${photo.filename}`}
                  alt={photo.caption ?? photo.plant_name}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                  <span className="block font-medium">{photo.plant_name}</span>
                  {photo.caption && <span className="block text-white/80">{photo.caption}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
