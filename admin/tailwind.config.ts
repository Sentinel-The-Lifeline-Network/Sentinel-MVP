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
        background: '#F7F4EE',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        primary: '#0B3D2E',
        'primary-light': '#1F5A47',
        'emergency-red': '#C53A2D',
        'danger-soft': '#EDE0DD',
        'success-green': '#1F5A47',
        muted: '#6B6B6B',
        border: '#E7E0D7',
        danger: '#C53A2D',
        warning: '#C9A227',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
