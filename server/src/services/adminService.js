const supabase = require('../config/supabase');

const DAYS_TRACKED = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const dateKey = (isoString) => new Date(isoString).toISOString().slice(0, 10);

const buildDailySeries = (rows, dateField) => {
  const days = [];
  for (let i = DAYS_TRACKED - 1; i >= 0; i -= 1) {
    days.push(dateKey(new Date(Date.now() - i * DAY_MS).toISOString()));
  }

  const counts = days.reduce((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {});

  rows.forEach((row) => {
    const day = dateKey(row[dateField]);
    if (day in counts) counts[day] += 1;
  });

  return days.map((day) => ({ date: day, count: counts[day] }));
};

const countBy = (rows, field) =>
  rows.reduce((acc, row) => {
    const key = row[field] ?? 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const countTable = async (table) => {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

const getStats = async () => {
  const [
    totalUsers,
    totalAlerts,
    totalContacts,
    totalTrackingViews,
    { data: users, error: usersError },
    { data: alerts, error: alertsError },
    { data: contacts, error: contactsError },
    { data: notifications, error: notificationsError },
  ] = await Promise.all([
    countTable('users'),
    countTable('sos_alerts'),
    countTable('emergency_contacts'),
    countTable('tracking_link_views'),
    supabase.from('users').select('created_at'),
    supabase
      .from('sos_alerts')
      .select('id, status, started_at, ended_at, created_at, tracking_token, users(full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('emergency_contacts').select('invite_status'),
    supabase.from('notifications_log').select('channel, status'),
  ]);

  if (usersError) throw usersError;
  if (alertsError) throw alertsError;
  if (contactsError) throw contactsError;
  if (notificationsError) throw notificationsError;

  const alertsByStatus = countBy(alerts, 'status');
  const contactsByStatus = countBy(contacts, 'invite_status');

  const notificationStats = notifications.reduce((acc, row) => {
    const channel = row.channel ?? 'unknown';
    const status = row.status ?? 'unknown';
    acc[channel] = acc[channel] || {};
    acc[channel][status] = (acc[channel][status] || 0) + 1;
    return acc;
  }, {});

  const recentAlerts = alerts.slice(0, 10);
  const recentAlertIds = recentAlerts.map((alert) => alert.id);

  let viewCountsByAlert = {};
  if (recentAlertIds.length) {
    const { data: views, error: viewsError } = await supabase
      .from('tracking_link_views')
      .select('alert_id')
      .in('alert_id', recentAlertIds);
    if (viewsError) throw viewsError;
    viewCountsByAlert = countBy(views, 'alert_id');
  }

  return {
    totals: {
      users: totalUsers,
      alerts: totalAlerts,
      contacts: totalContacts,
      trackingViews: totalTrackingViews,
      activeAlerts: alertsByStatus.active || 0,
      resolvedAlerts: alertsByStatus.resolved || 0,
      cancelledAlerts: alertsByStatus.cancelled || 0,
      pushEnabledContacts: contactsByStatus.push_enabled || 0,
    },
    alertsByStatus,
    contactsByStatus,
    notificationStats,
    signupsByDay: buildDailySeries(users, 'created_at'),
    alertsByDay: buildDailySeries(alerts, 'created_at'),
    recentAlerts: recentAlerts.map((alert) => ({
      id: alert.id,
      status: alert.status,
      started_at: alert.started_at,
      ended_at: alert.ended_at,
      user_name: alert.users?.full_name || 'Unknown',
      tracking_views: viewCountsByAlert[alert.id] || 0,
    })),
  };
};

module.exports = { getStats };
