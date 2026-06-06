const router = require('express').Router();
const { getTrackingData } = require('../controllers/trackingController');

// Public route — no auth required (shared tracking link)
router.get('/:token', getTrackingData);

module.exports = router;
