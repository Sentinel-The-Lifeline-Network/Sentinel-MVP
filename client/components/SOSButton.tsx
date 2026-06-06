'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { SOSState } from '@/hooks/useSOS';

interface SOSButtonProps {
  state: SOSState;
  onPress: () => void;
}

export default function SOSButton({ state, onPress }: SOSButtonProps) {
  const isIdle = state === 'idle';
  const isActivating = state === 'activating';
  const isActive = state === 'active';
  const statusText = isActivating
    ? 'SOS activation in progress'
    : isActive
    ? 'SOS alert active'
    : 'Ready to trigger SOS';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <p id="sos-status" className="sr-only" aria-live="assertive">
        {statusText}
      </p>
      {/* Far pulse ring — idle only */}
      <AnimatePresence>
        {isIdle && (
          <>
            <motion.div
              key="r3"
              className="absolute rounded-full"
              style={{ border: '1px solid rgba(239,68,68,0.12)' }}
              initial={{ width: 220, height: 220, opacity: 0 }}
              animate={{ width: 280, height: 280, opacity: [0, 0.6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0 }}
            />
            <motion.div
              key="r4"
              className="absolute rounded-full"
              style={{ border: '1px solid rgba(239,68,68,0.08)' }}
              initial={{ width: 220, height: 220, opacity: 0 }}
              animate={{ width: 290, height: 290, opacity: [0, 0.4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Active glow halo */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="active-halo"
            className="absolute rounded-full"
            style={{
              width: 250, height: 250,
              background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Outer decorative ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 226,
          height: 226,
          border: isActive
            ? '2px solid rgba(239,68,68,0.35)'
            : '1px solid rgba(239,68,68,0.15)',
          boxShadow: isActive ? '0 0 40px rgba(239,68,68,0.2)' : 'none',
          transition: 'all 0.6s ease',
        }}
      />

      {/* Main SOS button */}
      <motion.button
        onClick={isIdle ? onPress : undefined}
        disabled={!isIdle}
        className="relative z-10 rounded-full flex items-center justify-center select-none focus-visible:ring-4 focus-visible:ring-accent-teal focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        style={{
          width: 210,
          height: 210,
          background: isActive
            ? 'radial-gradient(circle at 38% 32%, #FF5252 0%, #DC2626 45%, #991B1B 80%)'
            : 'radial-gradient(circle at 38% 32%, #FF6B6B 0%, #EF4444 45%, #DC2626 80%)',
          boxShadow: isActive
            ? '0 0 0 2px rgba(239,68,68,0.3), 0 0 80px rgba(239,68,68,0.65), 0 20px 60px rgba(0,0,0,0.6), inset 0 3px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(0,0,0,0.3)'
            : '0 0 0 1px rgba(239,68,68,0.2), 0 0 60px rgba(239,68,68,0.4), 0 20px 50px rgba(0,0,0,0.5), inset 0 3px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.25)',
          cursor: isIdle ? 'pointer' : 'default',
        }}
        whileTap={isIdle ? { scale: 0.92 } : undefined}
        animate={
          isActivating
            ? { scale: [1, 1.04, 1] }
            : isActive
            ? { scale: [1, 1.015, 1] }
            : { scale: 1 }
        }
        transition={
          isActivating
            ? { duration: 0.6, repeat: Infinity }
            : isActive
            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 400, damping: 22 }
        }
        aria-label={isIdle ? 'Trigger SOS emergency alert' : statusText}
        aria-describedby="sos-status"
        aria-pressed={isActive}
      >
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="font-black text-white select-none"
            style={{
              fontSize: 52,
              lineHeight: 1,
              letterSpacing: '0.05em',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            SOS
          </span>
          <AnimatePresence mode="wait">
            {isActivating && (
              <span key="act" className="text-white/90 text-[10px] font-bold tracking-[0.16em]">
                ACTIVATING...
              </span>
            )}
            {isActive && (
              <span key="active" className="text-white/90 text-[10px] font-bold tracking-[0.2em]">
                ACTIVE
              </span>
            )}
            {isIdle && (
              <span key="idle" className="text-white/70 text-[10px] font-medium tracking-widest">
                TAP
              </span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}
