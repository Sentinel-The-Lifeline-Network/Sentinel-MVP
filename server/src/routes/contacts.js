const router = require('express').Router();
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  resendInvite,
} = require('../controllers/contactsController');

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

const contactValidation = [
  body('contact_name').trim().notEmpty().withMessage('Full name is required'),
  body('phone_number').trim().notEmpty().withMessage('Phone number is required')
    .matches(PHONE_REGEX).withMessage('Enter a valid phone number with country code, e.g. +2348000000000'),
  body('relationship').trim().notEmpty().withMessage('Relationship is required'),
  body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('Priority must be between 1 and 3'),
];

const contactUpdateValidation = [
  param('id').trim().notEmpty().withMessage('Invalid contact id'),
  body('contact_name').optional().trim().notEmpty().withMessage('Full name is required'),
  body('phone_number').optional().trim()
    .matches(PHONE_REGEX).withMessage('Enter a valid phone number with country code, e.g. +2348000000000'),
  body('relationship').optional().trim().notEmpty().withMessage('Relationship is required'),
  body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('Priority must be between 1 and 3'),
];

router.use(authenticate);

router.get('/', getContacts);
router.post('/', contactValidation, validate, createContact);
router.put('/:id', contactUpdateValidation, validate, updateContact);
router.delete('/:id', [param('id').trim().notEmpty().withMessage('Invalid contact id')], validate, deleteContact);
router.post('/:id/resend-invite', [param('id').trim().notEmpty().withMessage('Invalid contact id')], validate, resendInvite);

module.exports = router;
