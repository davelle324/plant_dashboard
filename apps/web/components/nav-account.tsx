"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function NavAccount() {
  if (!clerkEnabled) {
    return (
      <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
        Dev mode
      </span>
    );
  }

  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream dark:bg-fern dark:text-ink">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
