import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload } from '@/lib/jwtPayload';

const PROTECTED = ['/reports', '/submit', '/status', '/account', '/dashboard'];
const ADMIN_PREFIX = '/admin';

function isProtectedPath(pathname: string): boolean {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  if (isProtectedPath(pathname) || isAdminPath(pathname)) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isAdminPath(pathname) && token) {
    const payload = decodeJwtPayload(token);
    const role = payload?.role;
    if (role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/reports';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/reports',
    '/reports/:path*',
    '/account',
    '/account/:path*',
    '/submit',
    '/submit/:path*',
    '/status/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
