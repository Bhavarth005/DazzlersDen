import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('Authorization')?.value

  const { pathname } = request.nextUrl
  console.log(pathname)

  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = pathname.startsWith('/auth')
  const isRootRoute = pathname === '/'

  if(isDashboardRoute) {
    console.log("Attempt to access dashboard")
  }

  // If user tries to go to /dashboard/* BUT has no token -> Kick to /auth/login
  if (isDashboardRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    // Optional: Add ?next=/dashboard/customers so you can redirect back after login
    loginUrl.searchParams.set('next', pathname) 
    return NextResponse.redirect(loginUrl)
  }

  // Protecting Login
  // If user tries to go to /auth/* BUT already has a token -> Send to /dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 5. SCENARIO C: Root Path Handling
  // If user hits localhost:3000/, decide where to send them
  if (isRootRoute) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Allow all other requests (public images, api, etc.)
  return NextResponse.next()
}

// Optimization: Only run on relevant paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}