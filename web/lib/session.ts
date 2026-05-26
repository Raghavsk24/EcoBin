// Anonymous session cookie helpers. The cookie is set the first time the
// user visits and is reused for every subsequent feedback submission.

import { cookies } from 'next/headers';

const SESSION_COOKIE = 'ecobin_sid';

export function ensureSessionId(): string {
  const jar = cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sid = crypto.randomUUID();
  jar.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,  // 1 year
  });
  return sid;
}

export function readSessionId(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}
