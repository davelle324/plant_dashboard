import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  title: "Plant Dashboard",
  description: "Track plants, care logs, reminders, and health signals.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🪴</text></svg>",
  },
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
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
