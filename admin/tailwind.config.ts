import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D12',
        surface: '#11151C',
        card: '#161B24',
        border: '#232A36',
        primary: '#34D399',
        muted: '#8A93A6',
        danger: '#F2545B',
        warning: '#F2B33D',
      },
    },
  },
  plugins: [],
};

export default config;
