'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SOSAlert } from '@/services/sosService';
import StatusBadge from './StatusBadge';

interface AlertHistoryCardProps {
  alert: SOSAlert;
  index: number;
}

const formatDuration = (start: string, end: string | null) => {
  if (!end) return 'Ongoing';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export default function AlertHistoryCard({ alert, index }: AlertHistoryCardProps) {
  const date = new Date(alert.started_at);
  const hasLocation = alert.last_latitude !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
    >
      <Link
        href={`/history/${alert.id}`}
        className="block glass-card rounded-2xl p-4 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-white">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <StatusBadge status={alert.status} />
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <p className="text-[10px] text-muted tracking-wide uppercase">Duration</p>
            <p className="text-sm font-medium text-white mt-0.5">
              {formatDuration(alert.started_at, alert.ended_at)}
            </p>
          </div>
          {hasLocation && (
            <div>
              <p className="text-[10px] text-muted tracking-wide uppercase">Location</p>
              <p className="text-sm font-mono text-white mt-0.5">
                {alert.last_latitude?.toFixed(4)}, {alert.last_longitude?.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
