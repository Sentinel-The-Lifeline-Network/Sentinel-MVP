const supabase = require('../config/supabase');
const { generateTrackingToken } = require('../utils/generateToken');
const {
  startRecurringEmergencyNotifications,
  notifyAlertClosed,
} = require('./notificationService');
const contactsService = require('./contactsService');

const getUserName = async (userId) => {
  const { data } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single();

  return data?.full_name || 'A Sentinel user';
};

const getNotificationContacts = async (userId, userName) =>
  (await contactsService.getContacts(userId)).map((contact) => ({
    ...contact,
    user_name: userName,
  }));

const notifyActiveAlert = async (alert, userId) => {
  const userName = await getUserName(userId);
  const contacts = await getNotificationContacts(userId, userName);
  return startRecurringEmergencyNotifications({ ...alert, user_name: userName }, contacts, {
    waitForImmediate: false,
  });
};

const queuedNotificationSummary = () => ({
  status: 'queued',
  contactCount: 0,
  deliveryCount: 0,
  sentCount: 0,
  failedCount: 0,
  channels: ['sms', 'email'],
  failures: [],
});

const triggerSOS = async (userId, { latitude, longitude }) => {
  const existingActive = await getActiveAlert(userId);
  if (existingActive) {
    notifyActiveAlert(existingActive, userId).catch((err) => {
      console.error('[Notification] Failed to restart active alert notifications:', err.message);
    });
    throw Object.assign(new Error('An active SOS alert already exists'), { statusCode: 409 });
  }

  const trackingToken = generateTrackingToken();
  const now = new Date().toISOString();

  const { data: alert, error } = await supabase
    .from('sos_alerts')
    .insert({
      user_id: userId,
      status: 'active',
      started_at: now,
      last_latitude: latitude || null,
      last_longitude: longitude || null,
      last_location_timestamp: latitude ? now : null,
      tracking_token: trackingToken,
    })
    .select()
    .single();

  if (error) throw error;

  if (latitude && longitude) {
    await supabase.from('location_updates').insert({
      alert_id: alert.id,
      latitude,
      longitude,
    });
  }

  notifyActiveAlert(alert, userId).catch((err) => {
    console.error('[Notification] Failed to start active alert notifications:', err.message);
  });

  return { ...alert, notification_summary: queuedNotificationSummary() };
};

const getActiveAlert = async (userId) => {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return data;
};

const markSafe = async (alertId, userId) => {
  const previousAlert = await getAlertById(alertId, userId);
  const { data, error } = await supabase
    .from('sos_alerts')
    .update({ status: 'resolved', ended_at: new Date().toISOString() })
    .eq('id', alertId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .select()
    .single();
  if (error) throw error;
  if (!data) throw Object.assign(new Error('No active alert found'), { statusCode: 404 });

  const userName = await getUserName(userId);
  const contacts = await getNotificationContacts(userId, userName);
  notifyAlertClosed({ ...previousAlert, ...data, user_name: userName }, contacts, 'resolved').catch((err) => {
    console.error('[Notification] Failed to send safe notification:', err.message);
  });

  return { ...data, notification_summary: queuedNotificationSummary() };
};

const stopAlert = async (alertId, userId) => {
  const previousAlert = await getAlertById(alertId, userId);
  const { data, error } = await supabase
    .from('sos_alerts')
    .update({ status: 'cancelled', ended_at: new Date().toISOString() })
    .eq('id', alertId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .select()
    .single();
  if (error) throw error;
  if (!data) throw Object.assign(new Error('No active alert found'), { statusCode: 404 });

  const userName = await getUserName(userId);
  const contacts = await getNotificationContacts(userId, userName);
  notifyAlertClosed({ ...previousAlert, ...data, user_name: userName }, contacts, 'cancelled').catch((err) => {
    console.error('[Notification] Failed to send cancelled notification:', err.message);
  });

  return { ...data, notification_summary: queuedNotificationSummary() };
};

const getAlertHistory = async (userId) => {
  const query = supabase
    .from('sos_alerts')
    .select('*')
    .eq('user_id', userId);

  const { data, error } = typeof query.order === 'function'
    ? await query.order('created_at', { ascending: false })
    : await query;
  if (error) throw error;
  return data;
};

const getAlertById = async (alertId, userId) => {
  const query = supabase
    .from('sos_alerts')
    .select('*, location_updates(*), alert_notifications(*)')
    .eq('id', alertId);

  if (userId) query.eq('user_id', userId);

  const { data, error } = await query.single();
  if (error) throw error;
  return data;
};

module.exports = { triggerSOS, getActiveAlert, markSafe, stopAlert, getAlertHistory, getAlertById };
