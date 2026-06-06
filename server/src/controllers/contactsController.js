const contactsService = require('../services/contactsService');
const { success, error } = require('../utils/response');

const getContacts = async (req, res, next) => {
  try {
    const data = await contactsService.getContacts(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const createContact = async (req, res, next) => {
  try {
    const { full_name, phone, email, relationship, notification_enabled } = req.body;
    const data = await contactsService.createContact(req.user.id, {
      full_name,
      phone,
      email: email || null,
      relationship,
      notification_enabled: notification_enabled !== false,
    });
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const data = await contactsService.updateContact(req.user.id, id, updates);
    if (!data) return error(res, 'Contact not found', 404);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    await contactsService.deleteContact(req.user.id, req.params.id);
    success(res, { message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getContacts, createContact, updateContact, deleteContact };
