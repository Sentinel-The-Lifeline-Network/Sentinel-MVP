'use client';
import { motion } from 'framer-motion';

interface LocationCardProps {
  latitude: number | null;
  longitude: number | null;
  timestamp?: string | null;
  label?: string;
}

const formatCoord = (n: number | null) =>
  n !== null ? n.toFixed(6) : '—';

const formatTime = (ts?: string | null) => {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function LocationCard({ latitude, longitude, timestamp, label = 'Last Known Location' }: LocationCardProps) {
  const hasLocation = latitude !== null && longitude !== null;
  const googleMapsUrl = hasLocation
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : null;

  return (
    <motion.div
      className="glass-card rounded-2xl p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,194,168,0.15)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-muted tracking-wide uppercase">{label}</span>
        </div>
        {timestamp && (
          <span className="text-xs text-muted">{formatTime(timestamp)}</span>
        )}
      </div>

      {hasLocation ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-muted mb-1 tracking-wide">LATITUDE</p>
              <p className="text-sm font-mono font-semibold text-white">{formatCoord(latitude)}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-muted mb-1 tracking-wide">LONGITUDE</p>
              <p className="text-sm font-mono font-semibold text-white">{formatCoord(longitude)}</p>
            </div>
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{
                background: 'rgba(0,194,168,0.12)',
                color: '#00C2A8',
                border: '1px solid rgba(0,194,168,0.2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open in Google Maps
            </a>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted text-sm">Location not yet captured</p>
          <p className="text-muted/60 text-xs mt-1">Waiting for GPS signal...</p>
        </div>
      )}
    </motion.div>
  );
}
