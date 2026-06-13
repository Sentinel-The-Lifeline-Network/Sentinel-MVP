const crypto = require('crypto');
const config = require('../config');
const { error } = require('../utils/response');

const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const requireAdminKey = (req, res, next) => {
  if (!config.adminApiKey) return error(res, 'Admin dashboard is not configured', 503);

  const key = req.headers['x-admin-key'];
  if (!key || !timingSafeEqual(key, config.adminApiKey)) {
    return error(res, 'Invalid admin key', 401);
  }

  next();
};

module.exports = { requireAdminKey };
