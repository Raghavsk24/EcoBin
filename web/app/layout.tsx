import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoBin',
  description: 'Two-stage waste classifier. Point your camera at any item to find out which bin it belongs in.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black min-h-screen flex flex-col font-mono">
        <main className="flex-1 flex items-start justify-center p-6 pt-10">
          {children}
        </main>
        <footer className="text-center text-xs py-3 text-black">
          © 2025 Raghav Senthil Kumar. All rights reserved.
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
