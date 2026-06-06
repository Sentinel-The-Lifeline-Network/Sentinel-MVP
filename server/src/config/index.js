const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const frontendUrl = process.env.FRONTEND_URL || 'https://sentinel-omega-ten.vercel.app';
const allowedOrigins = frontendUrl.split(',').map((origin) => origin.trim()).filter(Boolean);

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
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM || 'Sentinel <onboarding@resend.dev>',
  },
};
