'use client';

import { useState } from 'react';
import type { InferResponse } from '@/lib/hf-client';
import { PATHWAY_BG, PATHWAY_BLURB, PATHWAY_LABEL, prettifyClassName, type Pathway } from '@/lib/disposal-info';

interface Props {
  result: InferResponse;
  imageBase64: string;
}

export default function ResultCard({ result }: Props) {
  const [showWhy, setShowWhy] = useState(false);

  if (result.status === 'rejected') {
    return (
      <div className="card-pop bg-pathway-rejected text-white">
        <h2 className="text-xl font-semibold mb-2">No classification</h2>
        <p className="text-sm opacity-90">
          We detected a person in this photo. To protect privacy, EcoBin does not classify images
          containing faces. Take another picture of just the item.
        </p>
      </div>
    );
  }

  const pathway = (result.pathway ?? 'garbage') as Pathway;

  return (
    <div className="space-y-3">
      <div className={`rounded-xl p-6 text-white ${PATHWAY_BG[pathway]}`}>
        <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Put this in</p>
        <h2 className="text-3xl font-bold">{PATHWAY_LABEL[pathway]}</h2>
        <p className="mt-2 text-sm opacity-90">{PATHWAY_BLURB[pathway]}</p>
      </div>

      <button
        onClick={() => setShowWhy(s => !s)}
        className="w-full text-left text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-1"
      >
        {showWhy ? '▾ Hide details' : '▸ Why this answer?'}
      </button>

      {showWhy && (
        <div className="card-pop space-y-4 text-sm">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">What we saw</p>
            <p className="font-medium">
              {result.predicted_class ? prettifyClassName(result.predicted_class) : '—'}
            </p>
            {typeof result.confidence === 'number' && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {Math.round(result.confidence * 100)}% confident
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
