const { firebase: firebaseConfig, nodeEnv } = require('../config');

const log = (...args) => {
  if (nodeEnv !== 'test') console.log('[Push]', ...args);
};

const logError = (...args) => {
  if (nodeEnv !== 'test') console.error('[Push]', ...args);
};

const isConfigured = () =>
  Boolean(firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey);

let messaging;

const getMessaging = () => {
  if (!isConfigured()) return null;
  if (!messaging) {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });
    }
    messaging = admin.messaging();
  }
  return messaging;
};

// Returns { status: 'sent' } or { status: 'failed', message, tokenInvalid }
const sendPushNotification = async (pushToken, { title, body, data = {} }) => {
  if (!pushToken) {
    return { status: 'failed', message: 'Missing push token' };
  }

  const fcm = getMessaging();
  if (!fcm) {
    if (nodeEnv === 'production') {
      return { status: 'failed', message: 'Firebase is not configured on the server' };
    }
    log(`Push fallback (dev) to ${pushToken.slice(0, 12)}...: ${title} - ${body}`, data);
    return { status: 'sent', provider: 'development-log' };
  }

  try {
    await fcm.send({
      token: pushToken,
      notification: { title, body },
      data,
      webpush: data.url ? { fcmOptions: { link: data.url } } : undefined,
    });
    log('Push send success', { tokenPrefix: pushToken.slice(0, 12) });
    return { status: 'sent', provider: 'fcm' };
  } catch (err) {
    const tokenInvalid = err.errorInfo?.code === 'messaging/registration-token-not-registered'
      || err.errorInfo?.code === 'messaging/invalid-registration-token';
    logError('Push send failed', { tokenPrefix: pushToken.slice(0, 12), message: err.message, tokenInvalid });
    return { status: 'failed', message: err.message, tokenInvalid };
  }
};

const buildSosPushPayload = ({ userName, trackingUrl }) => ({
  title: '🚨 Sentinel SOS Alert',
  body: `${userName} triggered an emergency alert. Tap to view live location.`,
  data: { url: trackingUrl },
});

const buildActiveReminderPushPayload = ({ userName, trackingUrl }) => ({
  title: '🚨 Sentinel Emergency Active',
  body: `${userName}'s emergency is still active. Tap to view live location.`,
  data: { url: trackingUrl },
});

const buildSafePushPayload = ({ userName, trackingUrl }) => ({
  title: 'Sentinel Update',
  body: `${userName} has marked themselves safe.`,
  data: { url: trackingUrl },
});

const buildCancelledPushPayload = ({ userName, trackingUrl }) => ({
  title: 'Sentinel Alert Cancelled',
  body: `${userName} cancelled the emergency alert.`,
  data: { url: trackingUrl },
});

module.exports = {
  sendPushNotification,
  buildSosPushPayload,
  buildActiveReminderPushPayload,
  buildSafePushPayload,
  buildCancelledPushPayload,
  isConfigured,
};
