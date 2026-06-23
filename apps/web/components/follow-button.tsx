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
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
        following
          ? "border border-black/10 bg-white/70 text-ink hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-cream"
          : "bg-ink text-cream hover:bg-moss"
      }`}
    >
      {isPending ? "…" : following ? "Following" : "Follow"}
    </button>
  );
}
