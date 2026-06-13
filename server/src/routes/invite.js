const router = require('express').Router();
const { param, body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { getInvite, acceptInvite, registerPushToken } = require('../controllers/inviteController');

const tokenValidation = [param('token').trim().notEmpty().withMessage('Invalid invite token')];

router.get('/:token', tokenValidation, validate, getInvite);
router.post('/:token/accept', tokenValidation, validate, acceptInvite);
router.post(
  '/:token/push-token',
  [...tokenValidation, body('token').trim().notEmpty().withMessage('Push token is required')],
  validate,
  registerPushToken
);

module.exports = router;
