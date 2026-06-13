const { notifications: notificationConfig, nodeEnv } = require('../config');

const log = (...args) => {
  if (nodeEnv !== 'test') console.log('[WhatsApp]', ...args);
};

const logError = (...args) => {
  if (nodeEnv !== 'test') console.error('[WhatsApp]', ...args);
};

const twilioMessagesUrl = () =>
  `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(notificationConfig.twilioAccountSid)}/Messages.json`;

const twilioAuthHeader = () =>
  `Basic ${Buffer.from(`${notificationConfig.twilioAccountSid}:${notificationConfig.twilioAuthToken}`).toString('base64')}`;

const whatsappAddressFor = (phone) => {
  if (!phone) return '';
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
};

// Normalizes phone numbers to E.164 digits (no leading +), with Nigeria-specific fallbacks
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

const sendWhatsAppMessage = async (phoneNumber, message) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    throw new Error(`Phone number is empty or invalid: ${phoneNumber}`);
  }
  const recipient = `+${normalizedPhone}`;

  if (!notificationConfig.twilioAccountSid || !notificationConfig.twilioAuthToken || !notificationConfig.twilioWhatsappFrom) {
    if (nodeEnv === 'production') {
      throw new Error('Twilio WhatsApp credentials are missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.');
    }
    log(`WhatsApp fallback (dev) to ${recipient}: ${message}`);
    return { status: 'sent', provider: 'development-log', channel: 'whatsapp' };
  }

  const payload = new URLSearchParams({
    To: whatsappAddressFor(recipient),
    From: whatsappAddressFor(notificationConfig.twilioWhatsappFrom),
    Body: message,
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
    logError('WhatsApp send failed', { phoneLast4: normalizedPhone.slice(-4), status: res.status, responseBody });
    throw new Error(`WhatsApp delivery failed with ${res.status}: ${responseBody}`);
  }

  const parsedBody = JSON.parse(responseBody || '{}');
  log('WhatsApp send success', { phoneLast4: normalizedPhone.slice(-4), sid: parsedBody.sid });
  return { status: 'sent', provider: 'twilio', channel: 'whatsapp', sid: parsedBody.sid };
};

const buildInviteMessage = ({ contactName, userName, inviteLink }) =>
  `Hi, ${contactName}. ${userName} added you as an emergency contact on Sentinel – The Lifeline Network.\n\nSentinel helps people quickly request help during emergencies by sharing SOS alerts and live location with trusted contacts.\n\nAccept the invite here:\n${inviteLink}\n\nOnce accepted, you'll receive instant emergency alerts from ${userName} through WhatsApp and push notifications.`;

const buildSosAlertMessage = ({ userName, locationLink }) =>
  `🚨 SENTINEL SOS ALERT\n\n${userName} has triggered an emergency alert.\n\nLive Location:\n${locationLink}\n\nStatus:\nEmergency active. Live tracking is enabled.\n\nPlease check immediately.`;

const buildActiveReminderMessage = ({ userName, locationLink }) =>
  `🚨 SENTINEL EMERGENCY UPDATE\n\n${userName}'s emergency alert is still active.\n\nLast Known Location:\n${locationLink}\n\nPlease check immediately.`;

module.exports = {
  sendWhatsAppMessage,
  normalizePhoneNumber,
  buildInviteMessage,
  buildSosAlertMessage,
  buildActiveReminderMessage,
};
