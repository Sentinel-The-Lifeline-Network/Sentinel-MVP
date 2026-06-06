'use client';
import { motion } from 'framer-motion';

interface TimelineStep {
  label: string;
  time?: string;
  done: boolean;
}

interface EmergencyTimelineProps {
  steps: TimelineStep[];
}

export default function EmergencyTimeline({ steps }: EmergencyTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <motion.div
          key={step.label}
          className="flex gap-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, duration: 0.4 }}
        >
          {/* Line + dot */}
          <div className="flex flex-col items-center">
            <motion.div
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{
                background: step.done ? '#10B981' : '#1E293B',
                border: step.done ? '2px solid #10B981' : '2px solid #334155',
                boxShadow: step.done ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.12 + 0.1, type: 'spring', stiffness: 400 }}
            />
            {i < steps.length - 1 && (
              <div
                className="w-0.5 flex-1 mt-1 mb-1"
                style={{
                  background: step.done ? 'linear-gradient(to bottom, #10B981, #334155)' : '#1E293B',
                  minHeight: 24,
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="pb-4 flex-1">
            <p
              className="text-sm font-medium"
              style={{ color: step.done ? '#F1F5F9' : '#475569' }}
            >
              {step.label}
            </p>
            {step.time && (
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                {step.time}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
