"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { followUser, unfollowUser } from "@/lib/api";

type Props = {
  userId: number;
  displayName: string;
  initialFollowing: boolean;
};

export function FollowButton({ userId, displayName, initialFollowing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  function toggle() {
    startTransition(async () => {
      try {
        if (following) {
          await unfollowUser(userId);
          setFollowing(false);
          toast.success(`Unfollowed ${displayName}`);
        } else {
          await followUser(userId);
          setFollowing(true);
          toast.success(`Following ${displayName}`);
        }
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={toggle}
      className={`group rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
        following
          ? "border border-black/10 bg-white/70 text-ink hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-cream dark:hover:border-rose-800 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
          : "bg-ink text-cream hover:bg-moss"
      }`}
    >
      {isPending ? "…" : following ? (
        <>
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : "Follow"}
    </button>
  );
}
