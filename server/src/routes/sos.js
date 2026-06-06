const router = require('express').Router();
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { sosLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');
const {
  triggerSOS,
  getActiveAlert,
  updateLocation,
  markSafe,
  stopAlert,
  getAlertHistory,
  getAlertById,
} = require('../controllers/sosController');

router.use(authenticate);

router.post(
  '/trigger',
  sosLimiter,
  [
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
  ],
  validate,
  triggerSOS
);

router.get('/active', getActiveAlert);

router.put(
  '/:alertId/location',
  [
    param('alertId').trim().notEmpty().withMessage('Invalid alert id'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('accuracy').optional().isFloat({ min: 0 }),
    body('speed').optional().isFloat(),
    body('heading').optional().isFloat({ min: 0, max: 360 }),
  ],
  validate,
  updateLocation
);

router.post('/:alertId/mark-safe', [param('alertId').trim().notEmpty(), body('pin').optional().isString().isLength({ max: 32 })], validate, markSafe);
router.post('/:alertId/stop', [param('alertId').trim().notEmpty(), body('pin').optional().isString().isLength({ max: 32 })], validate, stopAlert);

router.get('/history', getAlertHistory);
router.get('/:id', [param('id').trim().notEmpty().withMessage('Invalid alert id')], validate, getAlertById);

module.exports = router;
