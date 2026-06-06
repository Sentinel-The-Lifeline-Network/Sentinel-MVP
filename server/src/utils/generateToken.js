const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const generateTrackingToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

const generateId = () => uuidv4();

module.exports = { generateTrackingToken, generateId };
