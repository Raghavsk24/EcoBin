import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pathway: {
          curbside: '#1565C0',
          dropoff:  '#6A1B9A',
          compost:  '#F57F17',
          garbage:  '#37474F',
          rejected: '#B71C1C',
        },
      },
    },
  },
  plugins: [],
};

export default config;
