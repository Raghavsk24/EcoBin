import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoBin',
  description: 'A two-stage waste classification dashboard that tells you which bin an item belongs in.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 dark:border-slate-800">
          <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              EcoBin
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:underline">Classify</Link>
              <Link href="/quiz" className="hover:underline">Quiz</Link>
              <Link href="/about" className="hover:underline">About</Link>
            </div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="max-w-5xl mx-auto px-4 py-12 text-sm text-slate-500">
          Built with EcoBin&apos;s two-stage classifier. Predictions are imperfect; always check your local guidelines.
        </footer>
      </body>
    </html>
  );
}
