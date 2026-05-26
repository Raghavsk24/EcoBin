// Supabase clients. The anon key is safe to expose; the service-role key must
// never reach the browser and is only used inside server-only API routes.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getPublicSupabase() {
  if (!url || !anon) {
    throw new Error('Supabase public credentials are not configured');
  }
  return createClient(url, anon);
}

export function getServiceSupabase() {
  if (!url || !service) {
    throw new Error('Supabase service-role credentials are not configured');
  }
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
