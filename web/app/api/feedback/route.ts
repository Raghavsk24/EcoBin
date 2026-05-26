import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { ensureSessionId } from '@/lib/session';

interface Body {
  turnstileToken:        string;
  imageBase64:           string;
  modelPrediction:       unknown;
  userCorrectedPathway:  string;
  userCorrectedClass?:   string | null;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.turnstileToken) {
    return NextResponse.json({ error: 'missing_turnstile' }, { status: 400 });
  }

  // Block spam before we touch Supabase
  const ok = await verifyTurnstileToken(body.turnstileToken);
  if (!ok) {
    return NextResponse.json({ error: 'turnstile_failed' }, { status: 403 });
  }

  if (!body.imageBase64 || !body.userCorrectedPathway) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const sid = ensureSessionId();
  const supabase = getServiceSupabase();

  // 1. Upload the image to the feedback-images bucket
  const cleanBase64 = body.imageBase64.replace(/^data:image\/[^;]+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const filename = `${sid}/${Date.now()}.jpg`;

  const upload = await supabase
    .storage
    .from('feedback-images')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (upload.error) {
    return NextResponse.json({ error: 'storage_failed', detail: upload.error.message }, { status: 500 });
  }

  // 2. Insert the row
  const { error: insertError } = await supabase
    .from('feedback')
    .insert({
      image_url:               upload.data.path,
      model_prediction:        body.modelPrediction,
      user_corrected_pathway:  body.userCorrectedPathway,
      user_corrected_class:    body.userCorrectedClass ?? null,
      user_session_id:         sid,
    });

  if (insertError) {
    return NextResponse.json({ error: 'db_failed', detail: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
