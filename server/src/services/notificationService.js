const supabase = require('../config/supabase');
const { frontendUrl, notifications: notificationConfig, nodeEnv } = require('../config');

const activeNotificationJobs = new Map();

const log = (...args) => {
  if (nodeEnv !== 'test') console.log('[Notification]', ...args);
};

const logError = (...args) => {
  if (nodeEnv !== 'test') console.error('[Notification]', ...args);
};

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

const normalizeWhatsappNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('234')) return digits;

  // Nigeria local mobile format: 070..., 080..., 090... -> 23470..., 23480..., 23490...
  if (digits.startsWith('0') && digits.length >= 10) return `234${digits.slice(1)}`;

  // Nigeria mobile without leading zero: 70..., 80..., 90... -> 23470..., 23480..., 23490...
  if (/^[789]\d{9}$/.test(digits)) return `234${digits}`;

  return digits;
};

const sendWhatsapp = async (contact, message) => {
  const normalizedPhone = normalizeWhatsappNumber(contact.phone);
  log('WhatsApp send attempt', {
    contactId: contact.id,
    phoneLast4: normalizedPhone.slice(-4),
    normalizedPhoneLength: normalizedPhone.length,
    hasAccessToken: Boolean(notificationConfig.whatsappAccessToken),
    hasPhoneNumberId: Boolean(notificationConfig.whatsappPhoneNumberId),
  });

  if (!normalizedPhone) {
    throw new Error(`WhatsApp phone number is empty or invalid for contact ${contact.id}`);
  }

  if (!notificationConfig.whatsappAccessToken || !notificationConfig.whatsappPhoneNumberId) {
    if (nodeEnv === 'production') {
      throw new Error('WhatsApp credentials are missing. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.');
    }
    log(`WhatsApp fallback to ${contact.phone}: ${message}`);
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
        to: normalizedPhone,
        type: 'text',
        text: { preview_url: true, body: message },
      }),
    }
  );

  const body = await res.text();
  if (!res.ok) throw new Error(`WhatsApp delivery failed with ${res.status}: ${body}`);

  log('WhatsApp send success', {
    contactId: contact.id,
    phoneLast4: normalizedPhone.slice(-4),
    status: res.status,
    providerResponse: body,
  });
  return { status: 'sent', provider: 'whatsapp-cloud' };
};

const sendEmail = async (contact, subject, message) => {
  log('Email send attempt', {
    contactId: contact.id,
    email: contact.email,
    from: notificationConfig.emailFrom,
    hasResendApiKey: Boolean(notificationConfig.resendApiKey),
  });

  if (!notificationConfig.resendApiKey) {
    if (nodeEnv === 'production') {
      throw new Error('Resend API key is missing. Set RESEND_API_KEY.');
    }
    log(`Email fallback to ${contact.email}: ${subject}\n${message}`);
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

  const body = await res.text();
  if (!res.ok) throw new Error(`Email delivery failed with ${res.status}: ${body}`);

  log('Email send success', {
    contactId: contact.id,
    email: contact.email,
    status: res.status,
    providerResponse: body,
  });
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

  if (error) logError('Failed to log notification:', error.message);
};

const deliverToContact = async ({ alert, contact, subject, message }) => {
  const deliveries = [];

  if (contact.phone) deliveries.push(['whatsapp', () => sendWhatsapp(contact, message)]);
  if (contact.email) deliveries.push(['email', () => sendEmail(contact, subject, message)]);

  log('Delivering to contact', {
    alertId: alert.id,
    contactId: contact.id,
    contactName: contact.full_name,
    channels: deliveries.map(([channel]) => channel),
    notificationEnabled: contact.notification_enabled !== false,
  });

  await Promise.all(
    deliveries.map(async ([channel, send]) => {
      try {
        await send();
        await logNotification({ alertId: alert.id, contactId: contact.id, channel, status: 'sent' });
        log('Delivery logged as sent', { alertId: alert.id, contactId: contact.id, channel });
      } catch (err) {
        logError(`${channel} failed:`, {
          alertId: alert.id,
          contactId: contact.id,
          message: err.message,
        });
        await logNotification({ alertId: alert.id, contactId: contact.id, channel, status: 'failed' });
      }
    })
  );
};

const notifyContactsNow = async (alert, contacts, options = {}) => {
  const contactsToNotify = enabledContacts(contacts);
  log('Notification batch starting', {
    alertId: alert.id,
    totalContacts: contacts.length,
    enabledContacts: contactsToNotify.length,
    frontendUrl,
  });

  if (contactsToNotify.length === 0) {
    log('No enabled contacts with phone or email found for alert', { alertId: alert.id });
    return;
  }

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

  log('Starting recurring notifications', {
    alertId: alert.id,
    contactCount: contacts.length,
    sendImmediately,
    repeatIntervalMs: notificationConfig.repeatIntervalMs,
    hasWhatsappConfig: Boolean(notificationConfig.whatsappAccessToken && notificationConfig.whatsappPhoneNumberId),
    hasEmailConfig: Boolean(notificationConfig.resendApiKey),
  });

  if (sendImmediately) {
    await notifyContactsNow(alert, contacts, {
      subject: 'Sentinel SOS emergency alert',
      messageFactory: (contact) => emergencyMessage(alert, contact),
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

      await notifyContactsNow(alertWithUser, latestContacts, {
        subject: 'Sentinel SOS reminder - emergency alert still active',
        messageFactory: (contact) => emergencyMessage(alertWithUser, contact),
      });
    } catch (err) {
      logError('Recurring notification failed:', err.message);
    }
  }, notificationConfig.repeatIntervalMs);

  if (typeof intervalId.unref === 'function') intervalId.unref();
  activeNotificationJobs.set(alert.id, intervalId);
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
  _private: {
    enabledContacts,
    normalizeWhatsappNumber,
  },
};
