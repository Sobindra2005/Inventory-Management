import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
      - Skip the root route '/' (public)
      - Protect everything else
      - Also always protect API routes
    */
    '/((?!$).*)',       // Matches everything except root
    '/(api|trpc)(.*)',  // Always protect API and TRPC routes
  ],
};