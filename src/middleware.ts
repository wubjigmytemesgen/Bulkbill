import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const protectedRoutes = ['/admin', '/staff'];
const adminRoutes = ['/admin'];
const staffRoutes = ['/staff'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const role = session.role?.toLowerCase();

  // Route specific protection
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  const isStaffRoute = staffRoutes.some(route => path.startsWith(route));

  if (isAdminRoute && !['admin', 'head office management', 'staff management'].includes(role)) {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
  }

  if (isStaffRoute && !['admin', 'staff', 'head office management', 'staff management'].includes(role)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
  ],
};
