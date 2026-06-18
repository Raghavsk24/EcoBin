// Client for the EcoBin inference endpoint.

export interface InferResponse {
  status:          'ok' | 'rejected';
  reason:          string | null;
  predicted_class: string | null;
  confidence:      number | null;
  pathway:         string | null;
}

const HF_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL;

export async function classifyImage(base64: string, timeoutMs = 90_000): Promise<InferResponse> {
  if (!HF_URL) {
    throw new Error('NEXT_PUBLIC_HF_SPACE_URL is not configured');
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${HF_URL.replace(/\/$/, '')}/infer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Inference server returned ${res.status}: ${text}`);
    }
    return (await res.json()) as InferResponse;
  } finally {
    clearTimeout(t);
  }
}
