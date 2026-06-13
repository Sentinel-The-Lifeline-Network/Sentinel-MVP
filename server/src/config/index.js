const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cleanEnv = (value) => {
  const cleaned = value?.trim();
  return cleaned || undefined;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const frontendUrl = cleanEnv(process.env.FRONTEND_URL) || 'https://sentinel-omega-ten.vercel.app';
const corsOrigins = process.env.CORS_ORIGINS || [
  frontendUrl,
  'https://sentinel-omega-ten.vercel.app',
  'https://sentinel-mvp-nine.vercel.app',
].join(',');
const allowedOrigins = Array.from(
  new Set(corsOrigins.split(',').map((origin) => origin.trim()).filter(Boolean))
);

if (nodeEnv === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is required in production');
}

module.exports = {
  port: parseInteger(process.env.PORT, 4000),
  nodeEnv,
  frontendUrl,
  allowedOrigins,
  rateLimit: {
    windowMs: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    max: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 5),
  },
  contacts: {
    maxCount: parseInteger(process.env.MAX_EMERGENCY_CONTACTS, 10),
  },
  notifications: {
    repeatIntervalMs: parseInteger(process.env.NOTIFICATION_REPEAT_INTERVAL_MS, 5 * 60 * 1000),
    twilioAccountSid: cleanEnv(process.env.TWILIO_ACCOUNT_SID),
    twilioAuthToken: cleanEnv(process.env.TWILIO_AUTH_TOKEN),
    twilioWhatsappFrom: cleanEnv(process.env.TWILIO_WHATSAPP_FROM),
  },
  firebase: {
    projectId: cleanEnv(process.env.FIREBASE_PROJECT_ID),
    clientEmail: cleanEnv(process.env.FIREBASE_CLIENT_EMAIL),
    privateKey: cleanEnv(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
  },
};
