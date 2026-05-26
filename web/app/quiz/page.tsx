'use client';

import { useEffect, useState } from 'react';
import Flashcard from '@/components/Flashcard';
import { PATHWAY_LABEL, type Pathway } from '@/lib/disposal-info';

interface QuizItem {
  image: string;
  pathway: Pathway;
  note?: string;
}

interface QuizManifest {
  items: QuizItem[];
}

interface Score {
  correct: number;
  total: number;
  byPathway: Record<Pathway, { correct: number; total: number }>;
}

const EMPTY_SCORE: Score = {
  correct: 0,
  total: 0,
  byPathway: {
    curbside_recycling: { correct: 0, total: 0 },
    dropoff_recycling:  { correct: 0, total: 0 },
    compost:            { correct: 0, total: 0 },
    garbage:            { correct: 0, total: 0 },
  },
};

export default function QuizPage() {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState<Score>(EMPTY_SCORE);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/quiz/index.json')
      .then(r => {
        if (!r.ok) throw new Error('Quiz manifest not found');
        return r.json();
      })
      .then((m: QuizManifest) => {
        const shuffled = [...m.items].sort(() => Math.random() - 0.5);
        setItems(shuffled);
      })
      .catch(e => setLoadError((e as Error).message));
  }, []);

  function record(item: QuizItem, correct: boolean) {
    setScore(prev => {
      const next: Score = JSON.parse(JSON.stringify(prev));
      next.total += 1;
      next.byPathway[item.pathway].total += 1;
      if (correct) {
        next.correct += 1;
        next.byPathway[item.pathway].correct += 1;
      }
      return next;
    });
  }

  function reset() {
    setI(0);
    setScore(EMPTY_SCORE);
    setItems(prev => [...prev].sort(() => Math.random() - 0.5));
  }

  if (loadError) {
    return (
      <div className="card-pop">
        <h1 className="text-2xl font-bold mb-2">Quiz unavailable</h1>
        <p className="text-sm text-slate-500">{loadError}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="card-pop animate-pulse">Loading quiz…</div>;
  }

  if (i >= items.length) {
    const pct = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);
    return (
      <div className="space-y-4">
        <div className="card-pop bg-emerald-100 dark:bg-emerald-900/40">
          <h1 className="text-3xl font-bold">All done!</h1>
          <p className="mt-2 text-lg">
            You got <span className="font-semibold">{score.correct}</span> out of {score.total} right ({pct}%).
          </p>
        </div>
        <div className="card-pop space-y-2">
          <p className="text-sm font-medium">Accuracy by pathway:</p>
          {(Object.keys(score.byPathway) as Pathway[]).map(p => {
            const s = score.byPathway[p];
            const r = s.total === 0 ? null : Math.round((s.correct / s.total) * 100);
            return (
              <div key={p} className="flex justify-between text-sm">
                <span>{PATHWAY_LABEL[p]}</span>
                <span className="text-slate-500">
                  {s.correct} / {s.total} {r !== null && `(${r}%)`}
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={reset}
          className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          Play again
        </button>
      </div>
    );
  }

  const item = items[i];

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex justify-between text-sm text-slate-500">
        <span>Card {i + 1} of {items.length}</span>
        <span>Score: {score.correct} / {score.total}</span>
      </div>

      <Flashcard
        key={i}
        imagePath={item.image}
        truth={item.pathway}
        note={item.note}
        onAnswered={(correct) => record(item, correct)}
      />

      <button
        onClick={() => setI(i + 1)}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {i + 1 === items.length ? 'See results' : 'Next card →'}
      </button>
    </div>
  );
}
