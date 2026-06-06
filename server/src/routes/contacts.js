const router = require('express').Router();
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contactsController');

const contactValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().notEmpty().withMessage('WhatsApp phone number is required'),
  body('relationship').trim().notEmpty().withMessage('Relationship is required'),
  body('email').trim().notEmpty().withMessage('Working email is required').isEmail().withMessage('Invalid email'),
  body('notification_enabled').optional().isBoolean(),
];

const contactUpdateValidation = [
  param('id').trim().notEmpty().withMessage('Invalid contact id'),
  body('full_name').optional().trim().notEmpty().withMessage('Full name is required'),
  body('phone').optional().trim().notEmpty().withMessage('WhatsApp phone number is required'),
  body('relationship').optional().trim().notEmpty().withMessage('Relationship is required'),
  body('email').optional().trim().notEmpty().withMessage('Working email is required').isEmail().withMessage('Invalid email'),
  body('notification_enabled').optional().isBoolean(),
];

router.use(authenticate);

router.get('/', getContacts);
router.post('/', contactValidation, validate, createContact);
router.put('/:id', contactUpdateValidation, validate, updateContact);
router.delete('/:id', [param('id').trim().notEmpty().withMessage('Invalid contact id')], validate, deleteContact);

module.exports = router;
