'use client';

import { useState } from 'react';
import { PATHWAY_LABEL, type Pathway } from '@/lib/disposal-info';

interface Props {
  imagePath: string;
  truth: Pathway;
  note?: string;
  onAnswered: (correct: boolean) => void;
}

const CHOICES: Pathway[] = ['garbage', 'curbside_recycling', 'dropoff_recycling'];

export default function Flashcard({ imagePath, truth, note, onAnswered }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState<Pathway | null>(null);

  function choose(p: Pathway) {
    if (flipped) return;
    setPicked(p);
    setFlipped(true);
    onAnswered(p === truth);
  }

  const correct = picked === truth;

  return (
    <div className="flip-card w-full">
      <div className={`flip-inner relative w-full aspect-[3/4] ${flipped ? 'is-flipped' : ''}`}>
        {/* Front */}
        <div className="flip-face absolute inset-0 rounded-2xl overflow-hidden card-pop p-0">
          <img src={imagePath} alt="quiz item" className="w-full h-3/4 object-cover" />
          <div className="p-4 flex gap-2 justify-center">
            {CHOICES.map(p => (
              <button
                key={p}
                onClick={() => choose(p)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {PATHWAY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className={`flip-face flip-back absolute inset-0 rounded-2xl card-pop ${correct ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'}`}>
          <p className="text-3xl font-bold mb-2">
            {correct ? '✓ Correct' : '✗ Not quite'}
          </p>
          <p className="text-sm">
            The right answer is <span className="font-medium">{PATHWAY_LABEL[truth]}</span>.
          </p>
          {note && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{note}</p>}
        </div>
      </div>
    </div>
  );
}
