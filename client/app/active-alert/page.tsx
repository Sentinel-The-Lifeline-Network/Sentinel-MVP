'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import EmergencyTimeline from '@/components/EmergencyTimeline';
import LocationCard from '@/components/LocationCard';
import PinConfirmModal from '@/components/PinConfirmModal';
import { useSOS } from '@/hooks/useSOS';

export default function ActiveAlertPage() {
  const { state, alert, error, syncStatus, initialized, markSafe, stopAlert } = useSOS();
  const router = useRouter();
  const [elapsed, setElapsed] = useState('0:00');
  const [showMarkSafeModal, setShowMarkSafeModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (initialized && state === 'idle') router.push('/');
  }, [initialized, state, router]);

  useEffect(() => {
    if (!alert?.started_at) return;
    const start = new Date(alert.started_at).getTime();
    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setElapsed(`${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [alert?.started_at]);

  const timelineSteps = [
    { label: 'Alert triggered', time: alert?.started_at ? new Date(alert.started_at).toLocaleTimeString() : undefined, done: true },
    { label: 'Location captured', time: alert?.last_location_timestamp ? new Date(alert.last_location_timestamp).toLocaleTimeString() : undefined, done: !!alert?.last_latitude },
    { label: 'WhatsApp and email alerts sent automatically', done: alert?.sync_status !== 'pending' },
    { label: 'Repeat notifications active every 5 minutes', done: alert?.sync_status !== 'pending' },
    { label: 'Live location tracking active', done: state === 'active' },
  ];

  const trackingUrl = alert?.tracking_token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${alert.tracking_token}` : null;

  const handleMarkSafe = async (pin: string) => {
    setStopping(true);
    await markSafe(pin);
    setStopping(false);
    setShowMarkSafeModal(false);
  };

  const handleStop = async (pin: string) => {
    setStopping(true);
    await stopAlert(pin);
    setStopping(false);
    setShowStopModal(false);
  };

  const copyLink = () => {
    if (trackingUrl) navigator.clipboard.writeText(trackingUrl).catch(() => {});
  };

  return (
    <div className="min-h-dvh flex flex-col emergency-mesh-bg">
      <div
        className="sticky top-0 z-20 px-4 lg:px-8 pt-12 pb-4"
        style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(239,68,68,0.12)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: '#EF4444', boxShadow: '0 0 10px rgba(239,68,68,0.9)' }}
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-emergency-red">SOS Alert Active</span>
            </div>
            <h1 className="text-2xl font-black text-white">Emergency Mode</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted tracking-wide uppercase">Elapsed</p>
            <p className="text-2xl font-mono font-black text-emergency-red">{elapsed}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 lg:px-8 pt-4 pb-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'GPS', value: alert?.last_latitude ? 'Active' : 'Searching', color: alert?.last_latitude ? '#10B981' : '#F59E0B', icon: 'GPS' },
              { label: 'Contacts', value: alert?.sync_status === 'pending' ? 'Queued' : 'Auto-sent', color: alert?.sync_status === 'pending' ? '#F59E0B' : '#10B981', icon: 'WA' },
              { label: 'Tracking', value: trackingUrl ? 'Live' : 'Pending', color: trackingUrl ? '#EF4444' : '#F59E0B', icon: 'LIVE' },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-2xl p-3 text-center">
                <div className="text-[10px] font-black mb-1" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-[9px] text-muted uppercase tracking-wider">{s.label}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="status"
              className="space-y-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="glass-card rounded-2xl p-4" role="status" aria-live="polite">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)' }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Contacts notified automatically</p>
                    <p className="text-xs text-muted mt-0.5">WhatsApp and email alerts are sent immediately from the SOS request. Repeat messages continue every 5 minutes until you mark safe or cancel.</p>
                  </div>
                </div>
              </div>

              <LocationCard
                latitude={alert?.last_latitude ?? null}
                longitude={alert?.last_longitude ?? null}
                timestamp={alert?.last_location_timestamp}
              />

              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-4">Timeline</h3>
                <EmergencyTimeline steps={timelineSteps} />
              </div>

              {trackingUrl && (
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Shareable Tracking Link</p>
                  <div
                    className="rounded-xl px-3 py-2 mb-2 font-mono text-xs truncate"
                    style={{ background: '#0F172A', color: '#00C2A8' }}
                  >
                    {trackingUrl}
                  </div>
                  <button
                    onClick={copyLink}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{ background: 'rgba(0,194,168,0.12)', color: '#00C2A8', border: '1px solid rgba(0,194,168,0.2)' }}
                  >
                    Share Live Tracking Link
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowMarkSafeModal(true)}
              className="py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Mark Myself Safe
            </button>
            <button
              onClick={() => setShowStopModal(true)}
              className="py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              Stop Alert
            </button>
          </div>

          {error && (
            <p className="text-sm text-center font-medium py-2" style={{ color: '#F87171' }}>{error}</p>
          )}
          {syncStatus && (
            <p className="text-sm text-center font-semibold py-2" style={{ color: alert?.sync_status === 'pending' ? '#FBBF24' : '#00C2A8' }} role="status" aria-live="assertive">
              {syncStatus}
            </p>
          )}
        </div>
      </div>

      <PinConfirmModal isOpen={showMarkSafeModal} title="Mark Yourself Safe" description="Confirm you are safe. Your contacts will be notified and the alert will end." confirmLabel="I'm Safe" variant="safe" onConfirm={handleMarkSafe} onCancel={() => setShowMarkSafeModal(false)} loading={stopping} />
      <PinConfirmModal isOpen={showStopModal} title="Stop Emergency Alert" description="This cancels the active alert. Your contacts will receive a cancellation update." confirmLabel="Stop Alert" variant="stop" onConfirm={handleStop} onCancel={() => setShowStopModal(false)} loading={stopping} />
    </div>
  );
}
