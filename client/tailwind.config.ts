import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
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
        'security-blue': '#0B3D2E',
        'emergency-red': '#C53A2D',
        'danger-soft': '#EDE0DD',
        'success-green': '#1F5A47',
        'accent-teal': '#0B3D2E',
        muted: '#6B6B6B',
        border: '#E7E0D7',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      boxShadow: {
        'sos-glow': '0 18px 36px rgba(197, 58, 45, 0.22)',
        'sos-glow-active': '0 18px 36px rgba(197, 58, 45, 0.26)',
        glass: '0 1px 2px rgba(21, 21, 21, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
