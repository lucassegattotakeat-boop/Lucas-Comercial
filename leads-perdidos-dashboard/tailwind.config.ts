import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          500: '#2f6feb',
          600: '#2557c7',
          700: '#1d449c',
        },
      },
    },
  },
  plugins: [],
};

export default config;
