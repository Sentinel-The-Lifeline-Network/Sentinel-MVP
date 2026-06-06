const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const hashPin = async (pin) => {
  return bcrypt.hash(String(pin), SALT_ROUNDS);
};

const verifyPin = async (pin, hash) => {
  return bcrypt.compare(String(pin), hash);
};

module.exports = { hashPin, verifyPin };
