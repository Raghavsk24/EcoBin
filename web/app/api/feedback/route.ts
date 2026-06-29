import { NextRequest, NextResponse } from "next/server";

// Proxy /api/feedback -> {HF_SPACE_URL}/feedback. This is what drives the
// correction memory: { prediction_id, correct_item } teaches the backend the
// right answer for a previous prediction.
//
// Optional: if Supabase env vars are configured, the correction is ALSO logged
// to a `corrections` table on a best-effort basis. This is secondary — a missing
// or failing Supabase never blocks the correction-memory call and never breaks
// the build (the client is imported lazily only when env vars are present).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPACE_URL = process.env.HF_SPACE_URL ?? "http://localhost:7860";
const HF_TOKEN = process.env.HF_TOKEN;

interface FeedbackBody {
  prediction_id?: string;
  correct_item?: string;
}

async function logToSupabase(body: FeedbackBody): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return; // Supabase logging is opt-in.
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await supabase.from("corrections").insert({
      prediction_id: body.prediction_id ?? null,
      correct_item: body.correct_item ?? null,
    });
  } catch {
    // Best-effort only — never surface a logging failure to the user.
  }
}

export async function POST(req: NextRequest) {
  let body: FeedbackBody;
  try {
    body = (await req.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Secondary, non-blocking: optional Supabase audit log.
  void logToSupabase(body);

  // Primary: teach the correction memory on the Space.
  try {
    const upstream = await fetch(`${SPACE_URL.replace(/\/$/, "")}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream request failed";
    return NextResponse.json(
      { error: `Inference backend unreachable: ${message}` },
      { status: 502 }
    );
  }
}
