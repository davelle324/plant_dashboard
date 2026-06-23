import Link from "next/link";

import { discoverUsers } from "@/lib/api";
import { FollowButton } from "@/components/follow-button";
import { NavAccount } from "@/components/nav-account";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PublicUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q ?? "";
  let users: PublicUser[] = [];
  try {
    users = await discoverUsers(query);
  } catch {
    users = [];
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss dark:text-fern">Community</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">Find people to follow</h1>
        </div>
        <div className="flex items-center gap-4">
          <NavAccount />
          <ThemeToggle />
          <Link href="/" className="text-sm font-medium text-moss underline-offset-4 hover:underline dark:text-fern">
            Back home
          </Link>
        </div>
      </div>

      <form className="mt-8" action="/people" method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by handle…"
          className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition focus:border-moss dark:border-white/10 dark:bg-white/5 dark:text-cream"
        />
      </form>

      <ul className="mt-6 space-y-3">
        {users.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-slate-500 dark:border-white/10">
            {query ? `No one found for “${query}”.` : "No other gardeners yet — invite a friend!"}
          </li>
        ) : (
          users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white/70 p-4 shadow-soft dark:border-white/10 dark:bg-white/5"
            >
              <Link href={`/profile/${user.id}`} className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fern/30 text-lg">
                  🌱
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink dark:text-cream">{user.display_name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {user.plant_count} plants · {user.follower_count} followers
                  </span>
                </span>
              </Link>
              <FollowButton userId={user.id} displayName={user.display_name} initialFollowing={user.is_following} />
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
