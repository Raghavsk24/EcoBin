// Client for the EcoBin inference endpoints. Calls go to the same-origin Next.js
// route handlers (/api/predict, /api/feedback), which proxy to the HuggingFace
// Space server-side so the Space URL/token never reach the browser.

import type { PredictResult, FeedbackResult } from "@/lib/types";

async function postJSON<T>(url: string, body: unknown, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Inference server returned ${res.status}: ${text}`);
    }
    if (!res.ok) {
      const detail =
        (data as { error?: string; detail?: string }).error ??
        (data as { error?: string; detail?: string }).detail ??
        `Inference server returned ${res.status}`;
      throw new Error(detail);
    }
    return data as T;
  } finally {
    clearTimeout(t);
  }
}

// Classify one image. `image` is a base64 string (data: URI prefix is fine).
export async function predict(image: string, timeoutMs = 90_000): Promise<PredictResult> {
  return postJSON<PredictResult>("/api/predict", { image }, timeoutMs);
}

// Teach the correction memory the right answer for a previous prediction.
export async function feedback(
  predictionId: string,
  correctItem: string,
  timeoutMs = 30_000
): Promise<FeedbackResult> {
  return postJSON<FeedbackResult>(
    "/api/feedback",
    { prediction_id: predictionId, correct_item: correctItem },
    timeoutMs
  );
}
