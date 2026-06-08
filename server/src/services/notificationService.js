const supabase = require('../config/supabase');
const { frontendUrl, notifications: notificationConfig, nodeEnv } = require('../config');
const nodemailer = require('nodemailer');

const activeNotificationJobs = new Map();
let mailTransporter;

const twilioMessagesUrl = () =>
  `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(notificationConfig.twilioAccountSid)}/Messages.json`;

const twilioAuthHeader = () =>
  `Basic ${Buffer.from(`${notificationConfig.twilioAccountSid}:${notificationConfig.twilioAuthToken}`).toString('base64')}`;

const whatsappAddressFor = (phone) => {
  if (!phone) return '';
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
};

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

const normalizePhoneNumber = (phone) => {
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

const sendTwilioMessage = async ({ to, from, body, channel }) => {
  const payload = new URLSearchParams({
    To: to,
    From: from,
    Body: body,
  });

  const res = await fetch(twilioMessagesUrl(), {
    method: 'POST',
    headers: {
      Authorization: twilioAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  const responseBody = await res.text();
  if (!res.ok) {
    throw new Error(`${channel} delivery failed with ${res.status}: ${responseBody}`);
  }

  const parsedBody = JSON.parse(responseBody || '{}');
  return {
    status: 'sent',
    provider: 'twilio',
    channel,
    sid: parsedBody.sid,
  };
};

const sendPhoneNotification = async (contact, message) => {
  const normalizedPhone = normalizePhoneNumber(contact.phone);
  const recipient = normalizedPhone ? `+${normalizedPhone}` : '';

  log('Phone notification attempt', {
    contactId: contact.id,
    phoneLast4: normalizedPhone.slice(-4),
    normalizedPhoneLength: normalizedPhone.length,
    hasAccountSid: Boolean(notificationConfig.twilioAccountSid),
    hasAuthToken: Boolean(notificationConfig.twilioAuthToken),
    hasWhatsappFrom: Boolean(notificationConfig.twilioWhatsappFrom),
    hasSmsFrom: Boolean(notificationConfig.twilioSmsFrom),
  });

  if (!normalizedPhone) {
    throw new Error(`Phone number is empty or invalid for contact ${contact.id}`);
  }

  if (!notificationConfig.twilioAccountSid || !notificationConfig.twilioAuthToken || !notificationConfig.twilioSmsFrom) {
    if (nodeEnv === 'production') {
      throw new Error('Twilio credentials are missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM.');
    }
    log(`Phone notification fallback to ${contact.phone}: ${message}`);
    return { status: 'sent', provider: 'development-log', channel: 'sms' };
  }

  if (notificationConfig.twilioWhatsappFrom) {
    try {
      const whatsappResult = await sendTwilioMessage({
        to: `whatsapp:${recipient}`,
        from: whatsappAddressFor(notificationConfig.twilioWhatsappFrom),
        body: message,
        channel: 'whatsapp',
      });

      log('WhatsApp send success', {
        contactId: contact.id,
        phoneLast4: normalizedPhone.slice(-4),
        sid: whatsappResult.sid,
      });
      return whatsappResult;
    } catch (err) {
      logError('WhatsApp failed. Falling back to SMS:', {
        contactId: contact.id,
        phoneLast4: normalizedPhone.slice(-4),
        message: err.message,
      });
    }
  }

  const smsResult = await sendTwilioMessage({
    to: recipient,
    from: notificationConfig.twilioSmsFrom,
    body: message,
    channel: 'sms',
  });

  log('SMS send success', {
    contactId: contact.id,
    phoneLast4: normalizedPhone.slice(-4),
    sid: smsResult.sid,
  });
  return smsResult;
};

const getMailTransporter = () => {
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: notificationConfig.gmailUser,
        pass: notificationConfig.gmailAppPassword,
      },
    });
  }

  return mailTransporter;
};

const sendEmail = async (contact, subject, message) => {
  log('Email send attempt', {
    contactId: contact.id,
    email: contact.email,
    from: notificationConfig.emailFrom,
    hasGmailUser: Boolean(notificationConfig.gmailUser),
    hasGmailAppPassword: Boolean(notificationConfig.gmailAppPassword),
  });

  if (!notificationConfig.gmailUser || !notificationConfig.gmailAppPassword) {
    if (nodeEnv === 'production') {
      throw new Error('Gmail SMTP credentials are missing. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
    }
    log(`Email fallback to ${contact.email}: ${subject}\n${message}`);
    return { status: 'sent', provider: 'development-log' };
  }

  const info = await getMailTransporter().sendMail({
    from: notificationConfig.emailFrom || notificationConfig.gmailUser,
    to: contact.email,
    subject,
    text: message,
  });

  log('Email send success', {
    contactId: contact.id,
    email: contact.email,
    messageId: info.messageId,
  });
  return { status: 'sent', provider: 'gmail-smtp' };
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

const deliverToContact = async ({ alert, contact, subject, message }) => {
  const deliveries = [];

  if (contact.phone) deliveries.push(['sms', () => sendPhoneNotification(contact, message)]);
  if (contact.email) deliveries.push(['email', () => sendEmail(contact, subject, message)]);

  log('Delivering to contact', {
    alertId: alert.id,
    contactId: contact.id,
    contactName: contact.full_name,
    channels: deliveries.map(([channel]) => channel),
    notificationEnabled: contact.notification_enabled !== false,
  });

  return Promise.all(
    deliveries.map(async ([channel, send]) => {
      try {
        const result = await send();
        const deliveredChannel = result?.channel || channel;
        await logNotification({ alertId: alert.id, contactId: contact.id, channel: deliveredChannel, status: 'sent' });
        log('Delivery logged as sent', { alertId: alert.id, contactId: contact.id, channel: deliveredChannel });
        return {
          contactId: contact.id,
          contactName: contact.full_name,
          channel: deliveredChannel,
          status: 'sent',
        };
      } catch (err) {
        logError(`${channel} failed:`, {
          alertId: alert.id,
          contactId: contact.id,
          message: err.message,
        });
        await logNotification({ alertId: alert.id, contactId: contact.id, channel, status: 'failed' });
        return {
          contactId: contact.id,
          contactName: contact.full_name,
          channel,
          status: 'failed',
          message: err.message,
        };
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
    return summarizeDeliveryResults([], []);
  }

  const subject = options.subject || 'Sentinel SOS emergency alert';
  const message = options.message || emergencyMessage(alert, contactsToNotify[0]);

  const results = await Promise.all(
    contactsToNotify.map((contact) =>
      deliverToContact({
        alert,
        contact,
        subject,
        message: options.messageFactory ? options.messageFactory(contact) : message,
      })
    )
  );

  return summarizeDeliveryResults(contactsToNotify, results.flat());
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
    hasPhoneConfig: Boolean(notificationConfig.twilioAccountSid && notificationConfig.twilioAuthToken && notificationConfig.twilioSmsFrom),
    hasWhatsappConfig: Boolean(notificationConfig.twilioWhatsappFrom),
    hasEmailConfig: Boolean(notificationConfig.gmailUser && notificationConfig.gmailAppPassword),
  });

  const sendImmediateNotifications = async () => {
    const summary = await notifyContactsNow(alert, contacts, {
      subject: 'Sentinel SOS emergency alert',
      messageFactory: (contact) => emergencyMessage(alert, contact),
    });

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

  return notifyContactsNow(alert, contacts, {
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
        contacts
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
    normalizePhoneNumber,
    sendPhoneNotification,
    sendTwilioMessage,
  },
};
