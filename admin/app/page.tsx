'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import Badge, { BadgeVariant } from '@/components/Badge';
import ProgressRow from '@/components/ProgressRow';
import SectionHeader from '@/components/SectionHeader';
import {
  UsersIcon,
  AlertIcon,
  ActivityIcon,
  CheckCircleIcon,
  XCircleIcon,
  ContactsIcon,
  BellIcon,
  EyeIcon,
  RefreshIcon,
  LogoutIcon,
} from '@/components/icons';
import type { AdminStats } from '@/lib/types';

const ALERT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'danger',
  resolved: 'success',
  cancelled: 'neutral',
};

const CONTACT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending_invite: 'warning',
  accepted: 'info',
  push_enabled: 'success',
  push_disabled: 'neutral',
  whatsapp_only: 'info',
};

const NOTIFICATION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  sent: 'success',
  delivered: 'success',
  pending: 'warning',
  failed: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
  pending_invite: 'Pending Invite',
  accepted: 'Accepted',
  push_enabled: 'Push Enabled',
  push_disabled: 'Push Disabled',
  whatsapp_only: 'WhatsApp Only',
  sent: 'Sent',
  delivered: 'Delivered',
  pending: 'Pending',
  failed: 'Failed',
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function SkeletonCard() {
  return <div className="bg-card border border-border rounded-2xl p-4 h-[88px] animate-pulse" />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || 'Failed to load stats');
      setStats(body.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="w-8 h-8 rounded-lg" />
            <div>
              <h1 className="font-heading text-base font-bold leading-tight">Sentinel Admin</h1>
              <p className="text-xs text-muted leading-tight">Usage analytics · Internal only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="hidden sm:inline text-xs text-muted mr-1">
                Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              className="p-2 rounded-lg border border-border text-muted hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-60"
            >
              <RefreshIcon className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted hover:text-primary hover:border-primary/40 transition-colors"
            >
              <LogoutIcon width={14} height={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {error && (
          <div className="bg-danger-soft border border-[#E7CFC9] text-danger rounded-2xl p-4 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={handleRefresh} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <section>
            <SectionHeader title="Overview" description="Core metrics across the platform" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </section>
        ) : stats ? (
          <>
            <section>
              <SectionHeader title="Overview" description="Core metrics across the platform" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Users" value={stats.totals.users} icon={<UsersIcon />} accent="primary" />
                <StatCard label="SOS Alerts" value={stats.totals.alerts} icon={<AlertIcon />} accent="danger" />
                <StatCard
                  label="Active Now"
                  value={stats.totals.activeAlerts}
                  icon={<ActivityIcon />}
                  accent={stats.totals.activeAlerts > 0 ? 'danger' : 'muted'}
                  hint={stats.totals.activeAlerts > 0 ? 'Live emergencies in progress' : undefined}
                />
                <StatCard
                  label="Tracking Views"
                  value={stats.totals.trackingViews}
                  icon={<EyeIcon />}
                  accent="warning"
                  hint="Live location link opens"
                />
                <StatCard
                  label="Resolved"
                  value={stats.totals.resolvedAlerts}
                  icon={<CheckCircleIcon />}
                  accent="primary"
                />
                <StatCard
                  label="Cancelled"
                  value={stats.totals.cancelledAlerts}
                  icon={<XCircleIcon />}
                  accent="muted"
                />
                <StatCard
                  label="Contacts"
                  value={stats.totals.contacts}
                  icon={<ContactsIcon />}
                  accent="info"
                />
                <StatCard
                  label="Push Enabled"
                  value={stats.totals.pushEnabledContacts}
                  icon={<BellIcon />}
                  accent="info"
                  hint="Contacts receiving push alerts"
                />
              </div>
            </section>

            <section>
              <SectionHeader title="Trends" description="Activity over the last 14 days" />
              <div className="grid sm:grid-cols-2 gap-4">
                <BarChart title="Signups" data={stats.signupsByDay} />
                <BarChart title="SOS Alerts Triggered" data={stats.alertsByDay} />
              </div>
            </section>

            <section>
              <SectionHeader title="Engagement" description="Contact onboarding and notification delivery" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm font-semibold mb-4">Contact Invite Status</p>
                  {Object.keys(stats.contactsByStatus).length === 0 ? (
                    <p className="text-sm text-muted">No contacts yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.contactsByStatus).map(([status, count]) => (
                        <ProgressRow
                          key={status}
                          label={STATUS_LABELS[status] || status}
                          value={count}
                          max={stats.totals.contacts}
                          variant={CONTACT_STATUS_VARIANT[status] || 'neutral'}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm font-semibold mb-4">Notification Delivery</p>
                  {Object.keys(stats.notificationStats).length === 0 ? (
                    <p className="text-sm text-muted">No notifications sent yet.</p>
                  ) : (
                    <div className="space-y-5">
                      {Object.entries(stats.notificationStats).map(([channel, statuses]) => {
                        const channelTotal = Object.values(statuses).reduce((a, b) => a + b, 0);
                        return (
                          <div key={channel}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                              {channel}
                            </p>
                            <div className="space-y-2">
                              {Object.entries(statuses).map(([status, count]) => (
                                <ProgressRow
                                  key={status}
                                  label={STATUS_LABELS[status] || status}
                                  value={count}
                                  max={channelTotal}
                                  variant={NOTIFICATION_STATUS_VARIANT[status] || 'neutral'}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <SectionHeader title="Recent SOS Alerts" description="Most recent 10 alerts across all users" />
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {stats.recentAlerts.length === 0 ? (
                  <p className="text-sm text-muted p-5">No SOS alerts yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-border">
                          <th className="py-3 px-5 font-medium">User</th>
                          <th className="py-3 px-5 font-medium">Status</th>
                          <th className="py-3 px-5 font-medium">Started</th>
                          <th className="py-3 px-5 font-medium">Ended</th>
                          <th className="py-3 px-5 font-medium text-right">Tracking Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentAlerts.map((alert) => (
                          <tr key={alert.id} className="border-b border-border last:border-0 hover:bg-background/60">
                            <td className="py-3 px-5 font-medium">{alert.user_name}</td>
                            <td className="py-3 px-5">
                              <Badge
                                label={STATUS_LABELS[alert.status] || alert.status}
                                variant={ALERT_STATUS_VARIANT[alert.status] || 'neutral'}
                              />
                            </td>
                            <td className="py-3 px-5 text-muted">{formatDate(alert.started_at)}</td>
                            <td className="py-3 px-5 text-muted">{formatDate(alert.ended_at)}</td>
                            <td className="py-3 px-5 text-right font-semibold tabular-nums">
                              {alert.tracking_views}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
