'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SOSButton from '@/components/SOSButton';
import { useSOS } from '@/hooks/useSOS';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function HomePage() {
  const { state, triggerSOS, error, syncStatus } = useSOS();
  const { session } = useAuth();
  const online = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    if (state === 'active') router.replace('/active-alert');
  }, [state, router]);

  return (
    <div className="relative min-h-dvh flex flex-col mesh-bg overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(15,76,129,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 -left-24 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,194,168,0.06) 0%, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 pt-14 px-6 pb-2"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.9)' }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#10B981' }}>
                System Ready
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Sentinel
            </h1>
            <p className="text-muted text-sm font-medium mt-0.5">The Lifeline Network</p>
          </div>

          {/* Coverage indicator */}
          <div className="glass rounded-2xl px-3 py-2 flex flex-col items-center gap-1">
            <div className="flex gap-0.5 items-end h-4">
              {[2, 3, 4, 5, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-sm"
                  style={{
                    height: h * 3,
                    background: i < 4 ? '#10B981' : 'rgba(148,163,184,0.3)',
                  }}
                />
              ))}
            </div>
            <span className="text-[9px] text-muted tracking-wide">ONLINE</span>
          </div>
        </div>
      </motion.header>

      {/* Main — SOS centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-8" aria-live="polite">

        {/* Status pill */}
        <motion.div
          className="glass rounded-full px-5 py-2.5 flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.8)' }}
            />
            <span className="text-sm font-semibold text-white">Ready to protect you</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-xs text-muted font-medium">{online ? (session ? 'Secured' : 'Connecting...') : 'Offline ready'}</span>
        </motion.div>

        {/* SOS Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 180, damping: 18 }}
        >
          <SOSButton state={state} onPress={triggerSOS} />
        </motion.div>

        {/* Helper */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-white/80 text-sm font-semibold">Tap once to send emergency alert</p>
          <p className="text-muted/60 text-xs mt-1">GPS location captured · Contacts notified instantly</p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            className="glass-card rounded-2xl px-4 py-3 w-full flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-sm font-medium" style={{ color: '#F87171' }}>{error}</p>
          </motion.div>
        )}
        {syncStatus && (
          <motion.div
            className="glass-card rounded-2xl px-4 py-3 w-full flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: online ? '#00C2A8' : '#F59E0B' }} />
            <p className="text-sm font-medium" style={{ color: online ? '#00C2A8' : '#FBBF24' }}>{syncStatus}</p>
          </motion.div>
        )}
      </main>

      {/* Feature pills */}
      <motion.div
        className="relative z-10 px-6 pb-6 flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[
          { icon: '📍', label: 'Live GPS' },
          { icon: '🔔', label: 'Instant Alerts' },
          { icon: '🔒', label: 'Encrypted' },
        ].map((f) => (
          <div
            key={f.label}
            className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5"
          >
            <span className="text-[11px]">{f.icon}</span>
            <span className="text-[11px] font-medium text-muted">{f.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Bottom nav spacing on mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
