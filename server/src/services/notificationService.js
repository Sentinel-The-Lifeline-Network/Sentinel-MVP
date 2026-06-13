const supabase = require('../config/supabase');
const { frontendUrl, notifications: notificationConfig, nodeEnv } = require('../config');
const whatsappService = require('./whatsappService');
const pushService = require('./pushService');

const activeNotificationJobs = new Map();

const WHATSAPP_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

const log = (...args) => {
  if (nodeEnv !== 'test') console.log('[Notification]', ...args);
};

const logError = (...args) => {
  if (nodeEnv !== 'test') console.error('[Notification]', ...args);
};

const trackingUrlFor = (alert) => `${frontendUrl.replace(/\/$/, '')}/track/${alert.tracking_token}`;

const locationLinkFor = (alert) => {
  if (!alert.last_latitude || !alert.last_longitude) return trackingUrlFor(alert);
  return `https://maps.google.com/?q=${alert.last_latitude},${alert.last_longitude}`;
};

const logNotification = async ({ incidentId, userId, contactId, channel, status, message, errorMessage }) => {
  const { error } = await supabase.from('notifications_log').insert({
    incident_id: incidentId,
    user_id: userId,
    contact_id: contactId,
    channel,
    status,
    message,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    error_message: errorMessage || null,
  });

  if (error) logError('Failed to log notification:', error.message);
};

const sendPushToContact = async (alert, contact, payload) => {
  const result = await pushService.sendPushNotification(contact.push_token, payload);

  if (result.status === 'sent') {
    await logNotification({
      incidentId: alert.id,
      userId: alert.user_id,
      contactId: contact.id,
      channel: 'push',
      status: 'sent',
      message: payload.body,
    });
  } else {
    await logNotification({
      incidentId: alert.id,
      userId: alert.user_id,
      contactId: contact.id,
      channel: 'push',
      status: 'failed',
      message: payload.body,
      errorMessage: result.message,
    });

    if (result.tokenInvalid) {
      await supabase
        .from('emergency_contacts')
        .update({ push_enabled: false, invite_status: 'push_disabled' })
        .eq('id', contact.id);
    }
  }

  return { contactId: contact.id, contactName: contact.contact_name, channel: 'push', status: result.status, message: result.message };
};

const sendWhatsAppToContact = async (alert, contact, message) => {
  try {
    await whatsappService.sendWhatsAppMessage(contact.phone_number, message);
    await logNotification({
      incidentId: alert.id,
      userId: alert.user_id,
      contactId: contact.id,
      channel: 'whatsapp',
      status: 'sent',
      message,
    });
    return { contactId: contact.id, contactName: contact.contact_name, channel: 'whatsapp', status: 'sent' };
  } catch (err) {
    logError('WhatsApp delivery failed:', { contactId: contact.id, message: err.message });
    await logNotification({
      incidentId: alert.id,
      userId: alert.user_id,
      contactId: contact.id,
      channel: 'whatsapp',
      status: 'failed',
      message,
      errorMessage: err.message,
    });
    return { contactId: contact.id, contactName: contact.contact_name, channel: 'whatsapp', status: 'failed', message: err.message };
  }
};

const summarizeDeliveryResults = (contacts, results) => ({
  contactCount: contacts.length,
  deliveryCount: results.length,
  sentCount: results.filter((result) => result.status === 'sent').length,
  failedCount: results.filter((result) => result.status === 'failed').length,
  channels: Array.from(new Set(results.map((result) => result.channel))),
  failures: results
    .filter((result) => result.status === 'failed')
    .map((result) => ({
      contactId: result.contactId,
      contactName: result.contactName,
      channel: result.channel,
      message: result.message,
    })),
});

const updateLastWhatsappSentAt = async (alertId) => {
  const { error } = await supabase
    .from('sos_alerts')
    .update({ last_whatsapp_sent_at: new Date().toISOString() })
    .eq('id', alertId);

  if (error) logError('Failed to update last_whatsapp_sent_at:', error.message);
};

// SOS start: WhatsApp SOS alert to every contact with a phone number,
// plus an SOS push to contacts who accepted the invite and enabled push.
const sendInitialNotifications = async (alert, contacts) => {
  log('Sending initial SOS notifications', { alertId: alert.id, contactCount: contacts.length });

  if (contacts.length === 0) return summarizeDeliveryResults([], []);

  const userName = alert.user_name || 'A Sentinel user';
  const whatsappMessage = whatsappService.buildSosAlertMessage({ userName, locationLink: locationLinkFor(alert) });
  const pushPayload = pushService.buildSosPushPayload({ userName, trackingUrl: trackingUrlFor(alert) });

  const results = await Promise.all(
    contacts.map(async (contact) => {
      const deliveries = [];
      if (contact.phone_number) deliveries.push(sendWhatsAppToContact(alert, contact, whatsappMessage));
      if (contact.push_enabled && contact.push_token) deliveries.push(sendPushToContact(alert, contact, pushPayload));
      return Promise.all(deliveries);
    })
  );

  await updateLastWhatsappSentAt(alert.id);

  return summarizeDeliveryResults(contacts, results.flat());
};

// Every 5 minutes while the incident is active: push-only "still active" reminder
// to contacts who accepted the invite and enabled push. No WhatsApp here.
const sendPushReminder = async (alert, contacts) => {
  const pushEnabled = contacts.filter((contact) => contact.push_enabled && contact.push_token);
  if (pushEnabled.length === 0) return summarizeDeliveryResults([], []);

  const userName = alert.user_name || 'A Sentinel user';
  const payload = pushService.buildActiveReminderPushPayload({ userName, trackingUrl: trackingUrlFor(alert) });

  const results = await Promise.all(pushEnabled.map((contact) => sendPushToContact(alert, contact, payload)));
  return summarizeDeliveryResults(pushEnabled, results);
};

// At most one WhatsApp reminder per contact every 24 hours while the incident remains active.
const maybeSendWhatsappReminder = async (alert, contacts) => {
  const lastSentAt = alert.last_whatsapp_sent_at ? new Date(alert.last_whatsapp_sent_at).getTime() : 0;
  if (Date.now() - lastSentAt < WHATSAPP_REMINDER_INTERVAL_MS) return null;

  const withPhone = contacts.filter((contact) => contact.phone_number);
  if (withPhone.length === 0) return null;

  const userName = alert.user_name || 'A Sentinel user';
  const message = whatsappService.buildActiveReminderMessage({ userName, locationLink: locationLinkFor(alert) });

  const results = await Promise.all(withPhone.map((contact) => sendWhatsAppToContact(alert, contact, message)));
  await updateLastWhatsappSentAt(alert.id);

  return summarizeDeliveryResults(withPhone, results);
};

// Incident resolved/cancelled: push-only update to contacts who accepted the invite
// and enabled push. No WhatsApp is sent for resolved or cancelled incidents.
const sendClosureNotification = async (alert, contacts, status) => {
  const pushEnabled = contacts.filter((contact) => contact.push_enabled && contact.push_token);
  if (pushEnabled.length === 0) return summarizeDeliveryResults([], []);

  const userName = alert.user_name || 'A Sentinel user';
  const trackingUrl = trackingUrlFor(alert);
  const payload = status === 'resolved'
    ? pushService.buildSafePushPayload({ userName, trackingUrl })
    : pushService.buildCancelledPushPayload({ userName, trackingUrl });

  const results = await Promise.all(pushEnabled.map((contact) => sendPushToContact(alert, contact, payload)));
  return summarizeDeliveryResults(pushEnabled, results);
};

const startRecurringEmergencyNotifications = async (alert, contacts, options = {}) => {
  const { sendImmediately = true, waitForImmediate = true } = options;
  let immediateSummary = null;
  stopRecurringEmergencyNotifications(alert.id);

  log('Starting recurring notifications', {
    alertId: alert.id,
    contactCount: contacts.length,
    sendImmediately,
    waitForImmediate,
    repeatIntervalMs: notificationConfig.repeatIntervalMs,
    hasWhatsappConfig: Boolean(notificationConfig.twilioAccountSid && notificationConfig.twilioAuthToken && notificationConfig.twilioWhatsappFrom),
    hasPushConfig: pushService.isConfigured(),
  });

  const sendImmediateNotifications = async () => {
    const summary = await sendInitialNotifications(alert, contacts);
    options.onImmediateSummary?.(summary);
    return summary;
  };

  if (sendImmediately && waitForImmediate) {
    immediateSummary = await sendImmediateNotifications();
  } else if (sendImmediately) {
    sendImmediateNotifications().catch((err) => {
      logError('Immediate notification batch failed:', err.message);
    });
  }

  const intervalId = setInterval(async () => {
    try {
      log('Recurring notification tick', { alertId: alert.id });
      const latestAlert = await getActiveAlertForNotification(alert.id);
      if (!latestAlert) {
        log('Alert no longer active. Stopping recurring notifications.', { alertId: alert.id });
        stopRecurringEmergencyNotifications(alert.id);
        return;
      }

      const alertWithUser = { ...latestAlert, user_name: alert.user_name };
      const latestContacts = await getContactsForNotification(latestAlert.user_id, alert.user_name);

      await sendPushReminder(alertWithUser, latestContacts);
      await maybeSendWhatsappReminder(alertWithUser, latestContacts);
    } catch (err) {
      logError('Recurring notification failed:', err.message);
    }
  }, notificationConfig.repeatIntervalMs);

  if (typeof intervalId.unref === 'function') intervalId.unref();
  activeNotificationJobs.set(alert.id, intervalId);
  return immediateSummary;
};

const stopRecurringEmergencyNotifications = (alertId) => {
  const intervalId = activeNotificationJobs.get(alertId);
  if (!intervalId) {
    log('No recurring notification job to stop', { alertId });
    return;
  }

  clearInterval(intervalId);
  activeNotificationJobs.delete(alertId);
  log('Stopped recurring notification job', { alertId });
};

const notifyAlertClosed = async (alert, contacts, status) => {
  stopRecurringEmergencyNotifications(alert.id);
  log('Sending alert closed notification', { alertId: alert.id, status, contactCount: contacts.length });

  return sendClosureNotification(alert, contacts, status);
};

const getActiveAlertForNotification = async (alertId) => {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('id', alertId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data;
};

const getContactsForNotification = async (userId, userName) => {
  const query = supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId);

  const { data, error } = typeof query.order === 'function'
    ? await query.order('priority', { ascending: true })
    : await query;

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map((contact) => ({ ...contact, user_name: userName }));
};

const getUserNameForNotification = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.full_name || 'A Sentinel user';
};

const resumeActiveEmergencyNotifications = async () => {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('status', 'active');

  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) return 0;

  await Promise.all(
    data.map(async (alert) => {
      const userName = await getUserNameForNotification(alert.user_id);
      const contacts = await getContactsForNotification(alert.user_id, userName);
      // Resuming an existing incident does not count as a new SOS trigger,
      // so skip the immediate WhatsApp+push burst and just resume the schedule.
      await startRecurringEmergencyNotifications(
        { ...alert, user_name: userName },
        contacts,
        { sendImmediately: false }
      );
    })
  );

  return data.length;
};

module.exports = {
  startRecurringEmergencyNotifications,
  stopRecurringEmergencyNotifications,
  notifyAlertClosed,
  resumeActiveEmergencyNotifications,
  _private: {
    locationLinkFor,
    trackingUrlFor,
  },
};
