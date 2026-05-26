// Server-side verification for Cloudflare Turnstile tokens.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface VerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    throw new Error('TURNSTILE_SECRET is not configured');
  }
  if (!token) return false;

  const body = new URLSearchParams();
  body.append('secret', secret);
  body.append('response', token);

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;

  const data = (await res.json()) as VerifyResponse;
  return data.success === true;
}
