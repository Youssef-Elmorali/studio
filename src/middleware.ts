import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/client'; // Import client auth instance (might need admin SDK for server-side checks)

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // TODO: Implement Firebase authentication checks here if needed server-side.
  // For client-side protection, use the useAuth hook in components/layouts.

  // Example: Check if user is authenticated (requires careful handling on edge/server)
  // This is a basic example and might need the Admin SDK or alternative strategies
  // const token = request.cookies.get('firebaseIdToken')?.value; // Example cookie name

  // try {
  //   if (token) {
  //     // Verify token using Firebase Admin SDK (if running in a Node.js environment)
  //     // const decodedToken = await adminAuth.verifyIdToken(token);
  //     // If verified, proceed
  //   } else {
  //     // No token, handle redirection for protected routes
  //     if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/profile')) {
  //       const loginUrl = new URL('/auth/login', request.url);
  //       loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
  //       return NextResponse.redirect(loginUrl);
  //     }
  //   }
  // } catch (error) {
  //   console.error('Middleware Auth Error:', error);
  //   // Handle verification errors, maybe redirect to login
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
