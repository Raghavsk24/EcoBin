'use client';

import { useEffect, useState } from 'react';

interface QuizItem {
  image: string;
  title: string;
  pathway: string;
  note: string;
}

interface QuizResponse {
  item: QuizItem;
  userChoice: string | null;
  isCorrect: boolean;
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
  const [responses, setResponses] = useState<QuizResponse[]>([]);

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
    const isCorrect = key === cards[idx].pathway;
    if (isCorrect) setScore(s => s + 1);
    setResponses(prev => [...prev, { item: cards[idx], userChoice: key, isCorrect }]);
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
    setResponses([]);
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
    
    // Calculate most common mixup (wrong answer paired with correct answer)
    const mixups = responses
      .filter(r => !r.isCorrect)
      .map(r => `${r.userChoice}|${r.item.pathway}`)
      .filter(Boolean);
    const mixupCounts = new Map<string, number>();
    mixups.forEach(mixup => {
      mixupCounts.set(mixup, (mixupCounts.get(mixup) || 0) + 1);
    });
    const mostCommonMixup = mixups.length > 0 
      ? Array.from(mixupCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null;
    const [mostCommonUserChoice, mostCommonCorrect] = mostCommonMixup?.split('|') || [null, null];
    const mostCommonUserLabel = mostCommonUserChoice ? CHOICE_MAP[mostCommonUserChoice]?.label : null;
    const mostCommonCorrectLabel = mostCommonCorrect ? CHOICE_MAP[mostCommonCorrect]?.label : null;

    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Score summary */}
        <div style={{ border: '1px solid #000', padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1 }}>{score}/{TEST_SIZE}</p>
          <p style={{ fontSize: '0.875rem', color: '#777', marginTop: 6 }}>{pct}% correct</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 12 }}>
            {score >= 9 ? 'Perfect!' : score >= 7 ? 'Great job!' : score >= 5 ? 'Keep studying!' : 'Keep practicing!'}
          </p>
          {mostCommonUserLabel && mostCommonCorrectLabel && (
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 8 }}>
              Most common mixup:{' '}
              <span style={{ color: '#e74c3c' }}>{mostCommonUserLabel}</span>
              {' '}with{' '}
              <span style={{ color: '#47b868' }}>{mostCommonCorrectLabel}</span>
            </p>
          )}
        </div>

        {/* All questions review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {responses.map((response, i) => (
            <div key={i} style={{ border: '1px solid #ccc', padding: 16 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: 8 }}>Question {i + 1}</p>
              
              {/* Image */}
              <img
                src={response.item.image}
                alt={response.item.title}
                style={{ maxHeight: 75, objectFit: 'contain', border: '1px solid #e5e7eb', marginBottom: 12, display: 'block' }}
              />
              
              {/* Item title */}
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>{response.item.title}</p>
              
              {/* User choice and result */}
              <p style={{ fontSize: '0.8125rem', marginBottom: 8 }}>
                <strong>Your answer:</strong>{' '}
                <span style={{ color: response.isCorrect ? '#47b868' : '#e74c3c' }}>
                  {response.userChoice ? CHOICE_MAP[response.userChoice]?.label : 'Not answered'}
                  {response.isCorrect ? ' ✓' : ' ✗'}
                </span>
              </p>
              
              {!response.isCorrect && (
                <p style={{ fontSize: '0.8125rem', marginBottom: 8, color: '#666' }}>
                  <strong>Correct answer:</strong> {CHOICE_MAP[response.item.pathway]?.label}
                </p>
              )}
              
              {/* Explanation */}
              <p style={{ fontSize: '0.8125rem', color: '#555', lineHeight: 1.6 }}>{response.item.note}</p>
            </div>
          ))}
        </div>

        {/* Next quiz button */}
        <button
          onClick={restart}
          style={{
            width: '100%',
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

        {/* Image - Square */}
        <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={card.image}
            alt="quiz item"
            style={{ maxHeight: 340, maxWidth: 340, objectFit: 'contain', border: '1px solid #000', display: 'block' }}
          />
        </div>

        {/* Choice buttons */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
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

