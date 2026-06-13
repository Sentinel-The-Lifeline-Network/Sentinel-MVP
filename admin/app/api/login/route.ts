import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, getSessionToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ error: 'Admin dashboard is not configured' }, { status: 503 });
  }

  if (password !== expectedPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, await getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
