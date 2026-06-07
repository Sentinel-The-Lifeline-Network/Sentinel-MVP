'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LocationCard from '@/components/LocationCard';
import EmergencyTimeline from '@/components/EmergencyTimeline';
import StatusBadge from '@/components/StatusBadge';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const formatElapsedAgo = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ago`;
  return `${minutes}m ${seconds}s ago`;
};

interface TrackingData {
  id: string;
  status: 'active' | 'resolved' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_location_timestamp: string | null;
  user_name: string;
  location_history: Array<{ latitude: number; longitude: number; created_at: string }>;
}

export default function TrackPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tracking/${params.token}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds for active alerts
    const interval = setInterval(() => {
      if (data?.status === 'active') fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [params.token, data?.status]);

  if (loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: '#F7F4EE' }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-emergency-red border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#F7F4EE' }}
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#EDE0DD', border: '1px solid #E7E0D7' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C53A2D" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="font-bold text-lg" style={{ color: '#151515' }}>Link Not Found</p>
        <p className="text-muted text-sm mt-2">{error || 'This tracking link may have expired.'}</p>
      </div>
    );
  }

  const elapsed = data.started_at
    ? Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000)
    : 0;

  const timelineSteps = [
    { label: 'Alert triggered', time: new Date(data.started_at).toLocaleTimeString(), done: true },
    { label: 'Location captured', done: !!data.last_latitude },
    { label: 'Emergency contacts notified', done: true },
    { label: 'Live tracking active', done: data.status === 'active' },
    { label: data.status === 'resolved' ? 'Marked safe' : data.status === 'cancelled' ? 'Alert cancelled' : 'Awaiting response', done: data.status !== 'active' },
  ];

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#F7F4EE' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 pt-10 pb-4"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E7E0D7' }}
      >
        <div className="flex items-center gap-2 mb-1">
          {data.status === 'active' && (
            <motion.div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#C53A2D' }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: data.status === 'active' ? '#C53A2D' : '#6B6B6B' }}>
            {data.status === 'active' ? 'Live Emergency' : 'Emergency Report'}
          </span>
        </div>
        <h1 className="text-xl font-black" style={{ color: '#151515' }}>{data.user_name}</h1>
        <div className="flex items-center gap-3 mt-1">
          <StatusBadge status={data.status} />
          {data.status === 'active' && (
            <span className="text-xs text-muted">
              {formatElapsedAgo(elapsed)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 pt-5 space-y-4 pb-10">
        {/* Location */}
        <LocationCard
          latitude={data.last_latitude}
          longitude={data.last_longitude}
          timestamp={data.last_location_timestamp}
          label="Current Location"
        />

        {/* Location history count */}
        {data.location_history.length > 0 && (
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F7F4EE', border: '1px solid #E7E0D7' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B3D2E" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted">Movement Points Recorded</p>
              <p className="text-sm font-bold" style={{ color: '#151515' }}>{data.location_history.length} location updates</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: '#151515' }}>Alert Timeline</h3>
          <EmergencyTimeline steps={timelineSteps} />
        </div>

        {/* Instructions */}
        <div
          className="glass-card rounded-2xl p-4"
          style={{ borderLeft: '3px solid #0B3D2E' }}
        >
          <p className="text-xs font-bold text-accent-teal tracking-wide uppercase mb-2">Contact Instructions</p>
          <ul className="text-sm text-muted space-y-1.5">
            <li>• Call the person directly if you can reach them</li>
            <li>• Contact emergency services (911) if needed</li>
            <li>• Share this link with other responders</li>
            <li>• This page auto-refreshes while the alert is active</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
