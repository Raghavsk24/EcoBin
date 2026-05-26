# EcoBin Web

Next.js 14 dashboard for the EcoBin two-stage waste classifier. Three user-facing features: a camera-driven classifier, a disposal-pathway quiz, and a feedback/correction loop.

## Quick start

```bash
cd web
npm install
cp .env.example .env.local      # fill in the values
npm run dev
```

Open <http://localhost:3000>. The Classify page expects the HuggingFace Space at `NEXT_PUBLIC_HF_SPACE_URL` to be reachable.

## Environment variables

| Variable | Where | What |
| - | - | - |
| `NEXT_PUBLIC_HF_SPACE_URL` | client | Public URL of the inference Space (see `../inference/`) |
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase anon key (safe to ship) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Service-role key. Never expose. Only used in `/api/feedback`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | client | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET` | server only | Cloudflare Turnstile secret |

## Supabase setup

Once on the Supabase dashboard:

1. Create a Storage bucket called `feedback-images`. Leave it private.
2. Run this SQL in the SQL editor:

```sql
create table public.feedback (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  image_url               text not null,
  model_prediction        jsonb not null,
  user_corrected_pathway  text not null,
  user_corrected_class    text,
  user_session_id         text not null
);

alter table public.feedback enable row level security;

create policy "service role inserts"
  on public.feedback for insert
  to service_role
  with check (true);

create policy "service role reads"
  on public.feedback for select
  to service_role
  using (true);
```

The Next.js API route uses the service role key, so RLS denies all anon access by default.

## Quiz content

Populate `public/quiz/` with images extracted from `datasets/Test_Dataset.zip` and update `public/quiz/index.json` with one entry per image. The manifest is loaded client-side on the Quiz page.

## Deployment

1. Train the models on Kaggle (see the notebook in `../notebooks/`).
2. Download `ecobin_outputs.zip` and unpack the two `.keras` files into `../inference/`.
3. Push `../inference/` to a HuggingFace Space (SDK = Docker, hardware = CPU basic). Note the public URL.
4. Create a Supabase project and run the SQL above.
5. Sign up for Cloudflare Turnstile and get a site key + secret.
6. Add all of the env vars above to your Vercel project.
7. `vercel --prod` from this directory.
