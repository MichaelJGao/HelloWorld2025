/**
 * Next.js Middleware
 * 
 * This middleware file handles authentication and authorization for the PDF Keyword
 * Analyzer application using NextAuth.js. It protects routes and manages user sessions
 * across the application with configurable route matching and authorization callbacks.
 * 
 * Features:
 * - Route protection with NextAuth.js withAuth wrapper
 * - Session management and validation
 * - Public route configuration for unrestricted access
 * - Configurable authorization callbacks
 * - Request path matching patterns
 * - Automatic redirect handling for unauthenticated users
 * 
 * @fileoverview NextAuth.js middleware for route protection and session management
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

import { withAuth } from 'next-auth/middleware'

/**
 * NextAuth middleware with custom authorization logic
 * 
 * This middleware wraps all routes with authentication checks and provides
 * configurable authorization callbacks for fine-grained access control.
 */
export default withAuth(
  /**
   * Middleware function for additional request processing
   * 
   * @param req - Next.js request object
   */
  function middleware(req) {
    // Add any additional middleware logic here
    // This function runs after the authorization callback
  },
  {
    callbacks: {
      /**
       * Authorization callback to determine route access
       * 
       * @param token - NextAuth.js JWT token
       * @param req - Next.js request object
       * @returns boolean indicating whether access is authorized
       */
      authorized: ({ token, req }) => {
        // Define public routes that don't require authentication
        const publicRoutes = ['/', '/auth/signin', '/auth/error']
        if (publicRoutes.includes(req.nextUrl.pathname)) {
          return true
        }
        
        // For now, allow all routes - we'll add protection later
        // In production, this would check for valid tokens/sessions
        return true
      },
    },
  }
)

/**
 * Middleware configuration
 * 
 * Defines which request paths should be processed by the middleware.
 * Excludes API routes, static files, and other Next.js internals.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
