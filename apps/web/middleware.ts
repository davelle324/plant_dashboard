import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/settings"]);

export default clerkPublishableKey
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        auth.protect();
      }
    })
  : function middleware() {
      return;
    };

export const config = {
  matcher: ["/((?!_next|.*\..*).*)", "/(api|trpc)(.*)"]
};
