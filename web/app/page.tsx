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
    <div className="flex flex-col" style={{ maxWidth: '1100px', width: '100%' }}>
      {/* EcoBin Title */}
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '4px', marginTop: '-20px', textAlign: 'center' }}>
        <span style={{ color: '#47b868' }}>Eco</span>
        <span style={{ color: '#1973e6' }}>Bin</span>
      </h1>

      <div
        className="w-full bg-white flex flex-col"
        style={{
          minHeight: '80vh',
          borderTop: '1px solid #000',
          borderLeft: '1px solid #000',
          borderRight: '1px solid #000',
          borderBottom: '1px solid #000',
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
                borderRight: '1px solid #000',
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

        {/* Line after tabs */}
        <div style={{ borderBottom: '1px solid #000' }} />

        {/* Tab content */}
        <div className="flex-1">
          {tab === 'about' && <AboutTab />}
          {tab === 'scan'  && <ClassifyMode />}
          {tab === 'quiz'  && <FlashcardMode />}
        </div>
      </div>
    </div>
  );
}
