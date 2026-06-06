require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { port, allowedOrigins, nodeEnv } = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev', { skip: () => nodeEnv === 'test' }));
app.use(generalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'sentinel-api' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/responder', require('./routes/responder'));
app.use('/api/tracking', require('./routes/tracking'));

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`[Sentinel API] Running on port ${port} (${nodeEnv})`);
    require('./services/notificationService')
      .resumeActiveEmergencyNotifications()
      .then((count) => {
        if (count) console.log(`[Sentinel API] Resumed ${count} active SOS notification job(s)`);
      })
      .catch((err) => {
        console.error('[Sentinel API] Failed to resume SOS notification jobs:', err.message);
      });
  });
}

module.exports = app;
