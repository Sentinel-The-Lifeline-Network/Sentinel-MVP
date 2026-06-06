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
        background: '#020617',
        surface: '#0F172A',
        card: '#111827',
        'security-blue': '#0F4C81',
        'emergency-red': '#EF4444',
        'success-green': '#10B981',
        'accent-teal': '#00C2A8',
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      boxShadow: {
        'sos-glow': '0 0 60px rgba(239, 68, 68, 0.4)',
        'sos-glow-active': '0 0 80px rgba(239, 68, 68, 0.7)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
