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
    <div className="relative flex items-center justify-center" style={{ width: 348, height: 348, maxWidth: '90vw', maxHeight: '90vw' }}>
      <p id="sos-status" className="sr-only" aria-live="assertive">
        {statusText}
      </p>

      <div
        className="absolute rounded-full"
        style={{
          width: 'min(292px, 80vw)',
          height: 'min(292px, 80vw)',
          border: isActive ? '3px solid #C53A2D' : '1px solid #E7E0D7',
          background: '#FFFFFF',
          transition: 'all 0.25s ease',
        }}
      />

      <motion.button
        onClick={isIdle ? onPress : undefined}
        disabled={!isIdle}
        className="relative z-10 rounded-full flex items-center justify-center select-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        style={{
          width: 'min(256px, 72vw)',
          height: 'min(256px, 72vw)',
          background: isActive ? '#9F2E24' : '#C53A2D',
          border: '8px solid #FFFFFF',
          cursor: isIdle ? 'pointer' : 'default',
        }}
        whileHover={
          isIdle
            ? {
                scale: 1.06,
                y: -4,
                boxShadow: '0 20px 34px rgba(21, 21, 21, 0.18)',
              }
            : undefined
        }
        whileTap={isIdle ? { scale: 0.96 } : undefined}
        animate={isActivating ? { scale: [1, 1.015, 1] } : { scale: 1 }}
        transition={isActivating ? { duration: 0.9, repeat: Infinity } : { type: 'spring', stiffness: 360, damping: 24 }}
        aria-label={isIdle ? 'Trigger SOS emergency alert' : statusText}
        aria-describedby="sos-status"
        aria-pressed={isActive}
      >
        <div className="flex flex-col items-center gap-2">
          <span
            className="font-heading font-black text-white select-none"
            style={{ fontSize: 'clamp(56px, 16vw, 68px)', lineHeight: 1, letterSpacing: '0.03em' }}
          >
            SOS
          </span>
          <AnimatePresence mode="wait">
            {isActivating && (
              <span key="act" className="text-white/90 text-[10px] font-bold tracking-[0.16em]">
                SENDING
              </span>
            )}
            {isActive && (
              <span key="active" className="text-white/90 text-[10px] font-bold tracking-[0.18em]">
                ACTIVE
              </span>
            )}
            {isIdle && (
              <span key="idle" className="text-white/85 text-[10px] font-bold tracking-widest">
                PRESS ONCE
              </span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}
