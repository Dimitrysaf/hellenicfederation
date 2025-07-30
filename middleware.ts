import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('authenticated');
  const response = NextResponse.next();

  // If trying to access /admin without being authenticated, set a header
  if (request.nextUrl.pathname.startsWith('/admin') && !isAuthenticated) {
    response.headers.set('x-2fa-required', 'true');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
