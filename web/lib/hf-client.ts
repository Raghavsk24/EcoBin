// Client for the HuggingFace Space inference endpoint.

export interface StageBResult {
  predicted_subgroup: string;
  prob_contaminated:  number;
  threshold:          number;
}

export interface InferResponse {
  status:             'ok' | 'rejected';
  reason:             string | null;
  predicted_class:    string | null;
  stage_a_confidence: number | null;
  stage_a_pathway:    string | null;
  final_pathway:      string | null;
  stage_b_ran:        boolean;
  stage_b_result:     StageBResult | null;
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
      throw new Error(`HF Space returned ${res.status}: ${text}`);
    }
    return (await res.json()) as InferResponse;
  } finally {
    clearTimeout(t);
  }
}
