'use client';

import { useState } from 'react';
import type { InferResponse } from '@/lib/hf-client';
import { PATHWAY_BG, PATHWAY_BLURB, PATHWAY_LABEL, prettifyClassName, type Pathway } from '@/lib/disposal-info';
import FeedbackButton from './FeedbackButton';

interface Props {
  result: InferResponse;
  imageBase64: string;
}

export default function ResultCard({ result, imageBase64 }: Props) {
  const [showWhy, setShowWhy] = useState(false);

  if (result.status === 'rejected') {
    return (
      <div className="card-pop bg-pathway-rejected text-white">
        <h2 className="text-2xl font-semibold mb-2">No classification</h2>
        <p>
          We detected a person in this photo. To protect privacy, EcoBin does not classify images containing faces.
          Take another picture of just the item.
        </p>
      </div>
    );
  }

  const pathway = (result.final_pathway ?? 'garbage') as Pathway;
  const stageOverrode = result.stage_b_ran &&
    result.stage_a_pathway !== result.final_pathway;

  return (
    <div className="space-y-4">
      <div className={`card-pop ${PATHWAY_BG[pathway]} text-white`}>
        <p className="text-sm uppercase tracking-wide opacity-90">Put this in</p>
        <h2 className="text-4xl font-bold mt-1">{PATHWAY_LABEL[pathway]}</h2>
        <p className="mt-3 text-sm opacity-90">{PATHWAY_BLURB[pathway]}</p>
      </div>

      <button
        onClick={() => setShowWhy(s => !s)}
        className="w-full text-left text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
      >
        {showWhy ? '▾ Hide details' : '▸ Why this answer?'}
      </button>

      {showWhy && (
        <div className="card-pop space-y-3 text-sm">
          <div>
            <p className="text-slate-500">What we saw</p>
            <p className="font-medium">
              {result.predicted_class ? prettifyClassName(result.predicted_class) : ' - '}
            </p>
            {typeof result.stage_a_confidence === 'number' && (
              <p className="text-xs text-slate-500">
                We are {Math.round(result.stage_a_confidence * 100)}% confident.
              </p>
            )}
          </div>

          {result.stage_b_ran && result.stage_b_result && (
            <div>
              <p className="text-slate-500">Recyclability check</p>
              {stageOverrode ? (
                <p className="font-medium">
                  This looked recyclable, but our contamination check found
                  {' '}{prettifyClassName(result.stage_b_result.predicted_subgroup)}
                  {' '}({Math.round(result.stage_b_result.prob_contaminated * 100)}% confidence), so it should go to garbage.
                </p>
              ) : (
                <p className="font-medium">
                  We checked this item for food residue, liquid, and other contamination that would make it non-recyclable. It looks clean.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <FeedbackButton result={result} imageBase64={imageBase64} />
    </div>
  );
}
