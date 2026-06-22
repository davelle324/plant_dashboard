import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      {clerkPublishableKey ? <SignIn /> : <Link href="/" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream">Return home</Link>}
    </main>
  );
}
