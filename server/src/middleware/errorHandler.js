const { nodeEnv } = require('../config');

const errorHandler = (err, req, res, next) => {
  if (nodeEnv !== 'test') {
    console.error('[Error]', err.message, nodeEnv === 'development' ? err.stack : '');
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(nodeEnv === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
};

module.exports = { errorHandler, notFound };
