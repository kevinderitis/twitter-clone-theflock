import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#1d9bf0',
          700: '#1877c9',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
