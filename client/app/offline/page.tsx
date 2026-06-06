'use client';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#020617' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">You're Offline</h1>
        <p className="text-muted text-sm mb-6 max-w-[280px] mx-auto">
          Sentinel requires a network connection to send emergency alerts and track your location.
        </p>

        <div
          className="glass-card rounded-2xl p-4 text-left mb-6 max-w-[320px] mx-auto"
          style={{ borderLeft: '3px solid rgba(239,68,68,0.5)' }}
        >
          <p className="text-xs font-bold text-emergency-red uppercase tracking-wide mb-2">What to do</p>
          <ul className="text-sm text-muted space-y-1.5">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Call 911 or your local emergency number directly</li>
            <li>• Ask someone nearby for help</li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: '#EF4444' }}
        >
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
