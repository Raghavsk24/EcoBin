import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Courier New'", 'Courier', 'monospace'],
        mono: ["'Courier New'", 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
