
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Middleware does not use Firebase client directly for basic path protection.
// Server-side auth checks would typically use Admin SDK or API routes.

export function middleware(request: NextRequest) {
  // Client-side protection is primarily handled by the useAuth hook.
  // Middleware can add basic checks or redirects if needed, but verifying
  // Firebase auth state here securely often requires backend interaction.

  console.log(`Middleware triggered for path: ${request.nextUrl.pathname}`);

  // Example: Basic redirect for unauthenticated users trying to access protected routes
  // This relies on client-side redirection if auth state is not easily verifiable here.
  const requiresAuth = request.nextUrl.pathname.startsWith('/dashboard') ||
                       request.nextUrl.pathname.startsWith('/profile');

  // NOTE: Checking cookies like `firebaseIdToken` here is NOT secure for route protection
  // as cookies can be manipulated. Proper verification needs backend interaction.
  // This example assumes client-side routing will handle the actual auth check.

  // if (requiresAuth) {
  //   // Redirect logic might be needed here if a secure server-side check was possible
  //   // For now, rely on client-side redirects in the pages/components themselves
  // }

  // Allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/ (authentication pages themselves)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/).*)',
  ],
};
