const router = require('express').Router();
const { requireAdminKey } = require('../middleware/adminAuth');
const { getStats } = require('../controllers/adminController');

router.use(requireAdminKey);

router.get('/stats', getStats);

module.exports = router;
