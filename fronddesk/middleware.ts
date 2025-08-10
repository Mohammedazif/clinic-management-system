import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/appointments', '/doctors', '/queue']
  
  // Static and API routes that should be ignored
  const ignoredRoutes = ['/api', '/_next', '/favicon.ico', '/globals.css']
  
  // Check if the current route should be ignored
  const isIgnoredRoute = ignoredRoutes.some(route => pathname.startsWith(route))
  if (isIgnoredRoute) {
    return NextResponse.next()
  }
  
  // Check if the current route is public or protected
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // If user is not authenticated and trying to access protected route or root
  if (!token && (isProtectedRoute || pathname === '/')) {
    console.log('Middleware: No token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user is authenticated and trying to access login page
  if (token && token.value && pathname === '/login') {
    console.log('Middleware: User authenticated, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Redirect root path to dashboard if authenticated
  if (token && token.value && pathname === '/') {
    console.log('Middleware: Redirecting root to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow access to all other routes (including unprotected pages)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
}
