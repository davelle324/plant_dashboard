import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  title: "Plant Dashboard",
  description: "Track plants, care logs, reminders, and health signals."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: ThemeProvider sets the 'dark' class client-side,
    // so the server and first client render disagree on <html> className — suppressed intentionally.
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {clerkPublishableKey ? (
            <ClerkProvider publishableKey={clerkPublishableKey}>
              {children}
            </ClerkProvider>
          ) : (
            children
          )}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
