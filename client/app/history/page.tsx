'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AlertHistoryCard from '@/components/AlertHistoryCard';
import { sosService, SOSAlert } from '@/services/sosService';

export default function HistoryPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sosService.getHistory().then(setAlerts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resolved = alerts.filter((a) => a.status === 'resolved').length;
  const cancelled = alerts.filter((a) => a.status === 'cancelled').length;

  return (
    <div className="min-h-dvh flex flex-col mesh-bg">
      <div className="px-5 pt-14 pb-4 lg:pt-10">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-1">Alert</p>
        <h1 className="text-3xl font-black text-white tracking-tight">History</h1>

        {alerts.length > 0 && (
          <div className="flex gap-4 mt-3">
            {[
              { label: 'Total', value: alerts.length, color: '#94A3B8' },
              { label: 'Resolved', value: resolved, color: '#10B981' },
              { label: 'Cancelled', value: cancelled, color: '#94A3B8' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <span className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-xs text-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-5 pb-28 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center pt-16">
            <div className="w-7 h-7 rounded-full border-2 border-emergency-red border-t-transparent animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <motion.div className="text-center pt-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <p className="text-white font-bold text-lg">No alerts yet</p>
            <p className="text-muted text-sm mt-1">Your emergency history will appear here</p>
          </motion.div>
        ) : (
          alerts.map((alert, i) => <AlertHistoryCard key={alert.id} alert={alert} index={i} />)
        )}
      </div>
    </div>
  );
}
