'use client';

import { useEffect, useState } from 'react';

interface QuizItem {
  image: string;
  title: string;
  pathway: string;
  note: string;
}

const TEST_SIZE = 10;

const CHOICES: { key: string; label: string; color: string }[] = [
  { key: 'curbside_recycling', label: 'Curbside Recycling', color: '#1973e6' },
  { key: 'dropoff_recycling',  label: 'Drop-off Recycling', color: '#9549b6' },
  { key: 'garbage',            label: 'Garbage',            color: '#47b868' },
];

type ChoiceKey = string;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CHOICE_MAP = Object.fromEntries(CHOICES.map(c => [c.key, c]));

export default function FlashcardMode() {
  const [allItems, setAllItems] = useState<QuizItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cards, setCards] = useState<QuizItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<ChoiceKey | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/quiz/index.json')
      .then(r => { if (!r.ok) throw new Error('Quiz manifest not found'); return r.json(); })
      .then(m => {
        const validKeys = new Set(CHOICES.map(c => c.key));
        const filtered: QuizItem[] = (m.items as QuizItem[]).filter(item => validKeys.has(item.pathway));
        setAllItems(filtered);
        setCards(shuffle([...filtered]).slice(0, TEST_SIZE));
      })
      .catch(e => setLoadError((e as Error).message));
  }, []);

  function choose(key: ChoiceKey) {
    if (picked) return;
    setPicked(key);
    if (key === cards[idx].pathway) setScore(s => s + 1);
  }

  function next() {
    if (idx + 1 >= TEST_SIZE) { setDone(true); return; }
    setIdx(i => i + 1);
    setPicked(null);
  }

  function restart() {
    setCards(shuffle([...allItems]).slice(0, TEST_SIZE));
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (loadError) {
    return <div style={{ padding: 32, fontSize: '0.875rem' }}>{loadError}</div>;
  }
  if (!cards.length) {
    return <div style={{ padding: 32, fontSize: '0.875rem', color: '#777' }}>Loading quiz...</div>;
  }

  /* ── Results screen ── */
  if (done) {
    const pct = Math.round((score / TEST_SIZE) * 100);
    return (
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ border: '1px solid #000', padding: '40px 48px', textAlign: 'center', width: '100%', maxWidth: 380 }}>
          <p style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1.1 }}>{score}/{TEST_SIZE}</p>
          <p style={{ fontSize: '0.875rem', color: '#777', marginTop: 6 }}>{pct}% correct</p>
          <p style={{ fontSize: '1rem', fontWeight: 700, marginTop: 12 }}>
            {score >= 9 ? 'Perfect!' : score >= 7 ? 'Great job!' : score >= 5 ? 'Keep studying!' : 'Keep practicing!'}
          </p>
        </div>
        <button
          onClick={restart}
          style={{
            width: '100%', maxWidth: 380,
            border: '1px solid #000', padding: '12px 24px',
            fontSize: '0.875rem', cursor: 'pointer',
            background: '#000', color: '#fff',
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          Next quiz →
        </button>
      </div>
    );
  }

  /* ── Question screen ── */
  const card    = cards[idx];
  const correct = card.pathway as ChoiceKey;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777', marginBottom: 4 }}>
        <span>Question {idx + 1} of {TEST_SIZE}</span>
        <span>Score: {score}</span>
      </div>
      <div style={{ width: '100%', height: 2, background: '#e5e7eb' }}>
        <div style={{ height: 2, background: '#000', width: `${(idx / TEST_SIZE) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Image + choices side by side */}
      <div style={{ display: 'flex', gap: 24 }}>

        {/* Image */}
        <div style={{ flex: 1 }}>
          <img
            src={card.image}
            alt="quiz item"
            style={{ width: '100%', maxHeight: 340, objectFit: 'cover', border: '1px solid #000', display: 'block' }}
          />
        </div>

        {/* Choice buttons */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#777', marginBottom: 4 }}>Which bin does this go in?</p>
          {CHOICES.map(({ key, label, color }) => {
            let bg      = color as string;
            let fg      = '#fff' as string;
            let opacity = 1;
            let extra: React.CSSProperties = {};

            if (picked) {
              if (key === correct) {
                extra = { outline: '3px solid #000', outlineOffset: 2 };
              } else if (key === picked) {
                bg = '#d1d5db'; fg = '#777';
              } else {
                bg = '#e5e7eb'; fg = '#aaa'; opacity = 0.6;
              }
            }

            return (
              <button
                key={key}
                onClick={() => choose(key)}
                disabled={!!picked}
                style={{
                  background: bg, color: fg, opacity,
                  border: 'none', padding: '12px 14px',
                  fontSize: '0.8125rem', fontWeight: 600, textAlign: 'left',
                  cursor: picked ? 'default' : 'pointer',
                  fontFamily: "'Courier New', Courier, monospace",
                  transition: 'opacity 0.2s',
                  ...extra,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {picked && (
        <div style={{ border: '1px solid #000', padding: 14, fontSize: '0.8125rem', lineHeight: 1.7 }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>
            {picked === correct
              ? '✓ Correct!'
              : <>✗ Incorrect. The correct answer is <strong>{CHOICE_MAP[correct]?.label ?? correct}</strong>.</>}
          </p>
          <p style={{ color: '#444' }}>{card.note}</p>
        </div>
      )}

      {/* Next button */}
      {picked && (
        <button
          onClick={next}
          style={{
            width: '100%', border: '1px solid #000',
            padding: '11px 24px', fontSize: '0.875rem',
            cursor: 'pointer', background: '#000', color: '#fff',
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {idx + 1 === TEST_SIZE ? 'See results' : 'Next question →'}
        </button>
      )}
    </div>
  );
}
