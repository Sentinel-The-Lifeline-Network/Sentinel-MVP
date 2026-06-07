'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';

interface ActiveAlert {
  id: string;
  status: 'active' | 'resolved' | 'cancelled';
  started_at: string;
  last_latitude: number | null;
  last_longitude: number | null;
  users: { full_name: string; phone: string; email: string };
}

export default function ResponderPage() {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const data = await api.get<ActiveAlert[]>('/api/responder/alerts');
      setAlerts(data);
      setLastRefresh(new Date());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#F7F4EE' }}
    >
      {/* Header — SOC style */}
      <div
        className="px-6 pt-12 pb-4"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E7E0D7',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-accent-teal uppercase">
            Operations Center
          </span>
        </div>
        <h1 className="text-2xl font-black" style={{ color: '#151515' }}>Sentinel Responder</h1>
        <p className="text-muted text-xs mt-1">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Active', value: alerts.filter((a) => a.status === 'active').length, color: '#C53A2D' },
          { label: 'Total', value: alerts.length, color: '#6B6B6B' },
          { label: 'Status', value: 'LIVE', color: '#0B3D2E' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="text-lg font-black mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div className="flex-1 px-6 pb-10 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold tracking-wide" style={{ color: '#151515' }}>Active Alerts</h2>
          <button
            onClick={load}
            className="text-xs text-muted flex items-center gap-1 active:opacity-60"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center pt-12">
            <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <motion.div
            className="text-center pt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FFFFFF', border: '1px solid #E7E0D7' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B3D2E" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: '#151515' }}>All Clear</p>
            <p className="text-muted text-sm mt-1">No active emergencies at this time</p>
          </motion.div>
        ) : (
          alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/responder/alerts/${alert.id}`}
                className="block glass-card rounded-2xl p-4 transition-all active:scale-[0.98]"
                style={{ borderLeft: alert.status === 'active' ? '3px solid #C53A2D' : '3px solid transparent' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#151515' }}>{alert.users?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted mt-0.5">{alert.users?.phone}</p>
                  </div>
                  <StatusBadge status={alert.status} />
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] text-muted tracking-wide uppercase">Started</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: '#151515' }}>
                      {new Date(alert.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {alert.last_latitude && (
                    <div>
                      <p className="text-[10px] text-muted tracking-wide uppercase">Location</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: '#151515' }}>
                        {alert.last_latitude.toFixed(4)}, {alert.last_longitude?.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
