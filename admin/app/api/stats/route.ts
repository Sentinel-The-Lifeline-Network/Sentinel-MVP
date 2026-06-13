import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, isValidSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  if (!(await isValidSession(req.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!backendUrl || !adminApiKey) {
    return NextResponse.json({ error: 'Admin dashboard backend is not configured' }, { status: 503 });
  }

  const res = await fetch(`${backendUrl}/api/admin/stats`, {
    headers: { 'x-admin-key': adminApiKey },
    cache: 'no-store',
  });

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
