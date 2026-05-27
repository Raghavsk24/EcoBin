'use client';

import { useState } from 'react';
import AboutTab from '@/components/AboutTab';
import ClassifyMode from '@/components/ClassifyMode';
import FlashcardMode from '@/components/FlashcardMode';

type Tab = 'about' | 'scan' | 'quiz';

const TABS: { id: Tab; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'scan', label: 'Scan Waste Item' },
  { id: 'quiz', label: 'Quiz Yourself' },
];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('about');

  return (
    <div
      className="w-full bg-white flex flex-col"
      style={{
        maxWidth: '1100px',
        minHeight: '80vh',
        border: '1px solid #000',
      }}
    >
      {/* Bookmark-style tab bar */}
      <div className="flex" style={{ borderBottom: '1px solid #000' }}>
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-6 py-3 text-sm transition-colors"
            style={{
              borderRight: i < TABS.length - 1 ? '1px solid #000' : 'none',
              backgroundColor: tab === t.id ? '#000' : '#fff',
              color: tab === t.id ? '#fff' : '#000',
              cursor: 'pointer',
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {tab === 'about' && <AboutTab />}
        {tab === 'scan'  && <ClassifyMode />}
        {tab === 'quiz'  && <FlashcardMode />}
      </div>
    </div>
  );
}
