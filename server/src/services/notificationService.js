const supabase = require('../config/supabase');
const { frontendUrl, notifications: notificationConfig, nodeEnv } = require('../config');

const activeNotificationJobs = new Map();

const enabledContacts = (contacts = []) =>
  contacts.filter((contact) => contact.notification_enabled !== false && (contact.phone || contact.email));

const trackingUrlFor = (alert) => `${frontendUrl.replace(/\/$/, '')}/track/${alert.tracking_token}`;

const locationTextFor = (alert) => {
  if (!alert.last_latitude || !alert.last_longitude) return 'Location is still being acquired.';
  return `Last known location: https://maps.google.com/?q=${alert.last_latitude},${alert.last_longitude}`;
};

const emergencyMessage = (alert, contact) =>
  [
    `EMERGENCY SOS: ${contact.user_name || 'A Sentinel user'} has triggered an emergency alert.`,
    locationTextFor(alert),
    `Live tracking: ${trackingUrlFor(alert)}`,
    'This alert will repeat every 5 minutes until the user marks safe or cancels it.',
  ].join('\n');

const finalMessage = (alert, status) => {
  const statusText = status === 'resolved'
    ? 'has marked themselves safe'
    : 'has cancelled the emergency alert';

  return [
    `Sentinel update: ${alert.user_name || 'The Sentinel user'} ${statusText}.`,
    `Alert status: ${status === 'resolved' ? 'Safe' : 'Cancelled'}.`,
    `Reference: ${trackingUrlFor(alert)}`,
  ].join('\n');
};

const normalizeWhatsappNumber = (phone) => phone.replace(/[^\d+]/g, '').replace(/^\+/, '');

const sendWhatsapp = async (contact, message) => {
  if (!notificationConfig.whatsappAccessToken || !notificationConfig.whatsappPhoneNumberId) {
    if (nodeEnv !== 'test') console.log(`[Notification] WhatsApp fallback to ${contact.phone}: ${message}`);
    return { status: 'sent', provider: 'development-log' };
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${notificationConfig.whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notificationConfig.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizeWhatsappNumber(contact.phone),
        type: 'text',
        text: { preview_url: true, body: message },
      }),
    }
  );

  if (!res.ok) throw new Error(`WhatsApp delivery failed with ${res.status}`);
  return { status: 'sent', provider: 'whatsapp-cloud' };
};

const sendEmail = async (contact, subject, message) => {
  if (!notificationConfig.resendApiKey) {
    if (nodeEnv !== 'test') console.log(`[Notification] Email fallback to ${contact.email}: ${subject}\n${message}`);
    return { status: 'sent', provider: 'development-log' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notificationConfig.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: notificationConfig.emailFrom,
      to: [contact.email],
      subject,
      text: message,
    }),
  });

  if (!res.ok) throw new Error(`Email delivery failed with ${res.status}`);
  return { status: 'sent', provider: 'resend' };
};

const logNotification = async ({ alertId, contactId, channel, status }) => {
  const { error } = await supabase.from('alert_notifications').insert({
    alert_id: alertId,
    contact_id: contactId,
    channel,
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  });

  if (error && nodeEnv !== 'test') {
    console.error('[Notification] Failed to log notification:', error.message);
  }
};

const deliverToContact = async ({ alert, contact, subject, message }) => {
  const deliveries = [];

  if (contact.phone) deliveries.push(['whatsapp', () => sendWhatsapp(contact, message)]);
  if (contact.email) deliveries.push(['email', () => sendEmail(contact, subject, message)]);

  await Promise.all(
    deliveries.map(async ([channel, send]) => {
      try {
        await send();
        await logNotification({ alertId: alert.id, contactId: contact.id, channel, status: 'sent' });
      } catch (err) {
        if (nodeEnv !== 'test') console.error(`[Notification] ${channel} failed:`, err.message);
        await logNotification({ alertId: alert.id, contactId: contact.id, channel, status: 'failed' });
      }
    })
  );
};

const notifyContactsNow = async (alert, contacts, options = {}) => {
  const contactsToNotify = enabledContacts(contacts);
  if (contactsToNotify.length === 0) return;

  const subject = options.subject || 'Sentinel SOS emergency alert';
  const message = options.message || emergencyMessage(alert, contactsToNotify[0]);

  await Promise.all(
    contactsToNotify.map((contact) =>
      deliverToContact({
        alert,
        contact,
        subject,
        message: options.messageFactory ? options.messageFactory(contact) : message,
      })
    )
  );
};

const startRecurringEmergencyNotifications = async (alert, contacts, options = {}) => {
  const { sendImmediately = true } = options;
  stopRecurringEmergencyNotifications(alert.id);

  if (sendImmediately) {
    await notifyContactsNow(alert, contacts, {
      subject: 'Sentinel SOS emergency alert',
      messageFactory: (contact) => emergencyMessage(alert, contact),
    });
  }

  const intervalId = setInterval(async () => {
    try {
      const latestAlert = await getActiveAlertForNotification(alert.id);
      if (!latestAlert) {
        stopRecurringEmergencyNotifications(alert.id);
        return;
      }

      const alertWithUser = { ...latestAlert, user_name: alert.user_name };
      const latestContacts = await getContactsForNotification(latestAlert.user_id, alert.user_name);

      await notifyContactsNow(alertWithUser, latestContacts, {
        subject: 'Sentinel SOS reminder - emergency alert still active',
        messageFactory: (contact) => emergencyMessage(alertWithUser, contact),
      });
    } catch (err) {
      if (nodeEnv !== 'test') console.error('[Notification] Recurring notification failed:', err.message);
    }
  }, notificationConfig.repeatIntervalMs);

  if (typeof intervalId.unref === 'function') intervalId.unref();
  activeNotificationJobs.set(alert.id, intervalId);
};

const stopRecurringEmergencyNotifications = (alertId) => {
  const intervalId = activeNotificationJobs.get(alertId);
  if (!intervalId) return;

  clearInterval(intervalId);
  activeNotificationJobs.delete(alertId);
};

const notifyAlertClosed = async (alert, contacts, status) => {
  stopRecurringEmergencyNotifications(alert.id);

  await notifyContactsNow(alert, contacts, {
    subject: status === 'resolved' ? 'Sentinel update - user is safe' : 'Sentinel update - alert cancelled',
    message: finalMessage(alert, status),
  });
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
    ? await query.order('created_at', { ascending: true })
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
};
