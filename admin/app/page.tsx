'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import type { AdminStats } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
  pending_invite: 'Pending Invite',
  accepted: 'Accepted',
  push_enabled: 'Push Enabled',
  push_disabled: 'Push Disabled',
  whatsapp_only: 'WhatsApp Only',
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error || 'Failed to load stats');
        setStats(body.data);
      })
      .catch((err: any) => setError(err.message));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 text-center">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const { totals, notificationStats, recentAlerts, contactsByStatus } = stats;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Sentinel Admin</h1>
          <p className="text-sm text-muted">Internal usage metrics — not visible to users.</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-2 rounded-lg border border-border text-muted hover:text-white"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Users" value={totals.users} />
        <StatCard label="Total SOS Alerts" value={totals.alerts} />
        <StatCard label="Active Alerts" value={totals.activeAlerts} />
        <StatCard label="Tracking Link Views" value={totals.trackingViews} hint="Times a live tracking link was opened" />
        <StatCard label="Resolved Alerts" value={totals.resolvedAlerts} />
        <StatCard label="Cancelled Alerts" value={totals.cancelledAlerts} />
        <StatCard label="Emergency Contacts" value={totals.contacts} />
        <StatCard label="Push-enabled Contacts" value={totals.pushEnabledContacts} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <BarChart title="Signups (last 14 days)" data={stats.signupsByDay} />
        <BarChart title="SOS Alerts Triggered (last 14 days)" data={stats.alertsByDay} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted mb-3">Contact Invite Status</p>
          <div className="space-y-2">
            {Object.entries(contactsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="text-muted">{STATUS_LABELS[status] || status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(contactsByStatus).length === 0 && <p className="text-sm text-muted">No contacts yet.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted mb-3">Notification Delivery</p>
          <div className="space-y-2">
            {Object.entries(notificationStats).map(([channel, statuses]) => (
              <div key={channel}>
                <p className="text-sm font-semibold capitalize">{channel}</p>
                <div className="flex gap-4 text-sm text-muted mt-1">
                  {Object.entries(statuses).map(([status, count]) => (
                    <span key={status}>
                      {status}: <span className="text-white font-medium">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(notificationStats).length === 0 && (
              <p className="text-sm text-muted">No notifications sent yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-muted mb-3">Recent SOS Alerts</p>
        {recentAlerts.length === 0 ? (
          <p className="text-sm text-muted">No SOS alerts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Ended</th>
                  <th className="py-2 pr-4">Tracking Views</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">{alert.user_name}</td>
                    <td className="py-2 pr-4">{STATUS_LABELS[alert.status] || alert.status}</td>
                    <td className="py-2 pr-4">{formatDate(alert.started_at)}</td>
                    <td className="py-2 pr-4">{formatDate(alert.ended_at)}</td>
                    <td className="py-2 pr-4">{alert.tracking_views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
