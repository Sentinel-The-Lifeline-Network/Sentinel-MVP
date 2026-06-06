const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllActiveAlerts,
  getAlertById,
  updateAlertStatus,
  resolveAlert,
} = require('../controllers/responderController');

router.use(authenticate);

router.get('/alerts', getAllActiveAlerts);
router.get('/alerts/:id', getAlertById);
router.put('/alerts/:id/status', updateAlertStatus);
router.post('/alerts/:id/resolve', resolveAlert);

module.exports = router;
