'use client';

import { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import ResultCard from '@/components/ResultCard';
import { classifyImage, type InferResponse } from '@/lib/hf-client';

export default function HomePage() {
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<InferResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCapture(base64: string) {
    setImage(base64);
    setResult(null);
    setError(null);
    setBusy(true);
    try {
      const out = await classifyImage(base64);
      setResult(out);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Which bin does this go in?</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Take a picture of any waste item and EcoBin will tell you which bin it belongs in.
        </p>

        {image ? (
          <div className="space-y-3">
            <img src={image} alt="captured" className="rounded-2xl w-full aspect-square object-cover" />
            <button
              onClick={reset}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Try another photo
            </button>
          </div>
        ) : (
          <CameraCapture onCapture={handleCapture} />
        )}
      </div>

      <div>
        {busy && (
          <div className="card-pop animate-pulse">
            <p className="font-medium mb-2">Analysing the image…</p>
            <p className="text-sm text-slate-500">
              The first request after the model has been idle takes a few extra seconds while we wake it up.
            </p>
          </div>
        )}
        {error && (
          <div className="card-pop bg-rose-50 dark:bg-rose-900/30">
            <p className="font-medium text-rose-700 dark:text-rose-300">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
        {result && image && <ResultCard result={result} imageBase64={image} />}
      </div>
    </div>
  );
}
