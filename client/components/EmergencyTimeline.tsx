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
                background: step.done ? '#1F5A47' : '#FFFFFF',
                border: step.done ? '2px solid #1F5A47' : '2px solid #E7E0D7',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.12 + 0.1, type: 'spring', stiffness: 400 }}
            />
            {i < steps.length - 1 && (
              <div
                className="w-0.5 flex-1 mt-1 mb-1"
                style={{
                  background: step.done ? '#1F5A47' : '#E7E0D7',
                  minHeight: 24,
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="pb-4 flex-1">
            <p
              className="text-sm font-medium"
              style={{ color: step.done ? '#151515' : '#6B6B6B' }}
            >
              {step.label}
            </p>
            {step.time && (
              <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>
                {step.time}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
