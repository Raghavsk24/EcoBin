'use client';

import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import type { InferResponse } from '@/lib/hf-client';
import { PATHWAY_LABEL, type Pathway } from '@/lib/disposal-info';

interface Props {
  result: InferResponse;
  imageBase64: string;
}

const PATHWAYS: Pathway[] = ['curbside_recycling', 'dropoff_recycling', 'compost', 'garbage'];

export default function FeedbackButton({ result, imageBase64 }: Props) {
  const [open, setOpen] = useState(false);
  const [correctPathway, setCorrectPathway] = useState<Pathway | null>(null);
  const [correctClass, setCorrectClass] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function submit() {
    if (!token || !correctPathway) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnstileToken: token,
          imageBase64,
          modelPrediction: result,
          userCorrectedPathway: correctPathway,
          userCorrectedClass: correctClass || null,
        }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card-pop text-sm bg-emerald-50 dark:bg-emerald-900/30">
        Thanks for the correction. We use these to improve future predictions.
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex gap-2 text-sm">
        <button className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
          👍 Looks right
        </button>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          👎 This is wrong
        </button>
      </div>
    );
  }

  return (
    <div className="card-pop space-y-3">
      <p className="text-sm font-medium">What should this be?</p>
      <div className="grid grid-cols-2 gap-2">
        {PATHWAYS.map(p => (
          <button
            key={p}
            onClick={() => setCorrectPathway(p)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              correctPathway === p
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {PATHWAY_LABEL[p]}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <span className="text-slate-500">What was this item? (optional)</span>
        <input
          value={correctClass}
          onChange={e => setCorrectClass(e.target.value)}
          placeholder="e.g. coffee cup"
          className="mt-1 block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-800"
        />
      </label>

      {siteKey ? (
        <Turnstile siteKey={siteKey} onSuccess={setToken} options={{ size: 'invisible' }} />
      ) : (
        <p className="text-xs text-amber-600">
          Turnstile site key missing. Configure NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable spam protection.
        </p>
      )}

      <button
        onClick={submit}
        disabled={!correctPathway || !token || status === 'sending'}
        className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium"
      >
        {status === 'sending' ? 'Sending…' : 'Submit correction'}
      </button>

      {status === 'error' && (
        <p className="text-sm text-rose-600">Submission failed. Please try again.</p>
      )}
    </div>
  );
}
