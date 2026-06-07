'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LocationCard from '@/components/LocationCard';
import EmergencyTimeline from '@/components/EmergencyTimeline';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';

interface AlertDetail {
  id: string;
  status: 'active' | 'resolved' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_location_timestamp: string | null;
  tracking_token: string;
  users: { id: string; full_name: string; phone: string; email: string };
  alert_notifications: Array<{ id: string; status: string; sent_at: string }>;
  responder_actions: Array<{ id: string; action: string; note: string; created_at: string }>;
  location_history: Array<{ latitude: number; longitude: number; created_at: string }>;
}

export default function ResponderAlertPage({ params }: { params: { id: string } }) {
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .get<AlertDetail>(`/api/responder/alerts/${params.id}`)
      .then(setAlert)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleResolve = async () => {
    if (!alert) return;
    try {
      setResolving(true);
      await api.post(`/api/responder/alerts/${params.id}/resolve`, { note: 'Resolved by responder' });
      router.push('/responder');
    } catch {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#F7F4EE' }}>
        <div className="w-10 h-10 rounded-full border-2 border-accent-teal border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 text-center" style={{ background: '#F7F4EE' }}>
        <div>
          <p className="font-bold" style={{ color: '#151515' }}>Alert not found</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-muted">Go back</button>
        </div>
      </div>
    );
  }

  const timelineSteps = [
    { label: 'Alert triggered', time: new Date(alert.started_at).toLocaleTimeString(), done: true },
    { label: 'Location captured', done: !!alert.last_latitude },
    { label: `${alert.alert_notifications.length} notification(s) sent`, done: alert.alert_notifications.length > 0 },
    { label: 'Responder reviewing', done: true },
    { label: alert.status !== 'active' ? `Incident ${alert.status}` : 'Pending resolution', done: alert.status !== 'active' },
  ];

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#F7F4EE' }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-4 sticky top-0 z-20"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E7E0D7',
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted text-sm mb-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black" style={{ color: '#151515' }}>{alert.users.full_name}</h1>
            <p className="text-muted text-sm">{alert.users.phone}</p>
          </div>
          <StatusBadge status={alert.status} />
        </div>
      </div>

      <div className="flex-1 px-6 pt-5 space-y-4 pb-10 overflow-y-auto">
        {/* Location */}
        <LocationCard
          latitude={alert.last_latitude}
          longitude={alert.last_longitude}
          timestamp={alert.last_location_timestamp}
          label="Last Known Location"
        />

        {/* Contact info */}
        <motion.div
          className="glass-card rounded-2xl p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Incident Person</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Name</span>
              <span className="text-sm font-semibold" style={{ color: '#151515' }}>{alert.users.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Phone</span>
              <a href={`tel:${alert.users.phone}`} className="text-sm font-semibold" style={{ color: '#0B3D2E' }}>
                {alert.users.phone}
              </a>
            </div>
            {alert.users.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Email</span>
                <span className="text-sm font-semibold" style={{ color: '#151515' }}>{alert.users.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Notifications Sent</span>
              <span className="text-sm font-semibold" style={{ color: '#151515' }}>{alert.alert_notifications.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Location Points</span>
              <span className="text-sm font-semibold" style={{ color: '#151515' }}>{alert.location_history.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: '#151515' }}>Incident Timeline</h3>
          <EmergencyTimeline steps={timelineSteps} />
        </div>

        {/* Resolve action */}
        {alert.status === 'active' && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: '#0B3D2E' }}
          >
            {resolving ? 'Resolving...' : 'Mark as Resolved'}
          </button>
        )}
      </div>
    </div>
  );
}
