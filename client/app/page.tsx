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
      <motion.header
        className="relative z-10 pt-14 px-6 pb-2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: online ? '#1F5A47' : '#C53A2D' }} />
              <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: online ? '#1F5A47' : '#C53A2D' }}>
                {online ? 'Ready' : 'Offline queue ready'}
              </span>
            </div>
            <h1 className="font-heading text-4xl font-black tracking-tight" style={{ color: '#151515' }}>
              Sentinel
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: '#6B6B6B' }}>The Lifeline Network</p>
          </div>

          <div className="rounded-2xl px-3 py-2 border text-right" style={{ background: '#FFFFFF', borderColor: '#E7E0D7' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: '#6B6B6B' }}>Status</p>
            <p className="text-sm font-bold" style={{ color: session ? '#0B3D2E' : '#6B6B6B' }}>
              {session ? 'Protected' : 'Connecting'}
            </p>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-7" aria-live="polite">
        <motion.div
          className="rounded-full px-5 py-2.5 border"
          style={{ background: '#FFFFFF', borderColor: '#E7E0D7' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <span className="text-sm font-semibold" style={{ color: '#151515' }}>Press once to request help</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 180, damping: 18 }}
        >
          <SOSButton state={state} onPress={triggerSOS} />
        </motion.div>

        <motion.div
          className="grid grid-cols-3 gap-2 w-full max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {[
            { label: 'Location', value: 'GPS ready' },
            { label: 'Contacts', value: 'Auto alert' },
            { label: 'Tracking', value: 'Live link' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border px-3 py-3 text-center" style={{ background: '#FFFFFF', borderColor: '#E7E0D7' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: '#6B6B6B' }}>{item.label}</p>
              <p className="text-xs font-bold mt-1" style={{ color: '#0B3D2E' }}>{item.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="text-center max-w-xs">
          <p className="text-sm font-semibold" style={{ color: '#151515' }}>Location and contacts move first.</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B6B6B' }}>Sentinel sends your alert, live location, and safety updates without making you type during an emergency.</p>
        </div>

        {error && (
          <motion.div
            className="rounded-2xl px-4 py-3 w-full max-w-sm flex items-center gap-3 border"
            style={{ background: '#EDE0DD', borderColor: '#E7E0D7' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C53A2D" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-sm font-medium" style={{ color: '#C53A2D' }}>{error}</p>
          </motion.div>
        )}
        {syncStatus && (
          <motion.div
            className="rounded-2xl px-4 py-3 w-full max-w-sm flex items-center gap-3 border"
            style={{ background: '#FFFFFF', borderColor: '#E7E0D7' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: online ? '#1F5A47' : '#C53A2D' }} />
            <p className="text-sm font-medium" style={{ color: online ? '#0B3D2E' : '#C53A2D' }}>{syncStatus}</p>
          </motion.div>
        )}
      </main>

      <div className="h-20 lg:hidden" />
    </div>
  );
}
