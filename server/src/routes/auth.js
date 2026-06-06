const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createProfile, getProfile, updateProfile } = require('../controllers/authController');

router.post(
  '/profile',
  authenticate,
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('security_pin').optional().isLength({ min: 4, max: 8 }).withMessage('PIN must be 4-8 digits'),
  ],
  validate,
  createProfile
);

router.get('/profile', authenticate, getProfile);

router.put(
  '/profile',
  authenticate,
  [
    body('full_name').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('security_pin').optional().isLength({ min: 4, max: 8 }),
  ],
  validate,
  updateProfile
);

module.exports = router;
