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
const configuredEmailFrom = cleanEnv(process.env.EMAIL_FROM);
const emailFrom = configuredEmailFrom?.includes('onboarding@resend.dev')
  ? cleanEnv(process.env.GMAIL_USER)
  : configuredEmailFrom || cleanEnv(process.env.GMAIL_USER);
const smtpPort = parseInteger(process.env.SMTP_PORT, 465);

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
  notifications: {
    repeatIntervalMs: parseInteger(process.env.NOTIFICATION_REPEAT_INTERVAL_MS, 5 * 60 * 1000),
    twilioAccountSid: cleanEnv(process.env.TWILIO_ACCOUNT_SID),
    twilioAuthToken: cleanEnv(process.env.TWILIO_AUTH_TOKEN),
    twilioSmsFrom: cleanEnv(process.env.TWILIO_SMS_FROM),
    twilioWhatsappFrom: cleanEnv(process.env.TWILIO_WHATSAPP_FROM),
    gmailUser: cleanEnv(process.env.GMAIL_USER),
    gmailAppPassword: cleanEnv(process.env.GMAIL_APP_PASSWORD),
    smtpHost: cleanEnv(process.env.SMTP_HOST) || 'smtp.gmail.com',
    smtpPort,
    smtpSecure: cleanEnv(process.env.SMTP_SECURE) ? cleanEnv(process.env.SMTP_SECURE) === 'true' : smtpPort === 465,
    smtpConnectionTimeoutMs: parseInteger(process.env.SMTP_CONNECTION_TIMEOUT_MS, 15000),
    smtpGreetingTimeoutMs: parseInteger(process.env.SMTP_GREETING_TIMEOUT_MS, 10000),
    smtpSocketTimeoutMs: parseInteger(process.env.SMTP_SOCKET_TIMEOUT_MS, 20000),
    emailFrom,
  },
};
