import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/(.*)",   // FastAPI proxy — auth handled by the API itself
]);

export default clerkPublishableKey
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        const { userId, redirectToSignIn } = await auth();
        if (!userId) {
          return redirectToSignIn({ returnBackUrl: request.url });
        }
      }
    })
  : function middleware() {
      return;
    };

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"]
};
