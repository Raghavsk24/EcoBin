import { cookies } from 'next/headers';

const SESSION_COOKIE = 'ecobin_sid';

export async function ensureSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sid = crypto.randomUUID();
  jar.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return sid;
}

export async function readSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}
