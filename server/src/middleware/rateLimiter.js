const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config');

const sosLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: {
    success: false,
    error: 'Too many SOS requests. Please wait before triggering again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { sosLimiter, generalLimiter };
