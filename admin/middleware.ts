import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, isValidSession } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/login') || pathname === '/api/login') {
    return NextResponse.next();
  }

  if (!(await isValidSession(req.cookies.get(SESSION_COOKIE)?.value))) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
