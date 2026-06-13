const supabase = require('../config/supabase');
const { frontendUrl, contacts: contactsConfig, nodeEnv } = require('../config');
const { generateInviteToken } = require('../utils/generateToken');
const whatsappService = require('./whatsappService');

const log = (...args) => {
  if (nodeEnv !== 'test') console.log('[Contacts]', ...args);
};

const logError = (...args) => {
  if (nodeEnv !== 'test') console.error('[Contacts]', ...args);
};

const getUserName = async (userId) => {
  const { data } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single();

  return data?.full_name || 'A Sentinel user';
};

const inviteLinkFor = (token) => `${frontendUrl.replace(/\/$/, '')}/invite/${token}`;

const sendInvite = async (contact, userId) => {
  const userName = await getUserName(userId);

  try {
    await whatsappService.sendWhatsAppMessage(
      contact.phone_number,
      whatsappService.buildInviteMessage({
        contactName: contact.contact_name,
        userName,
        inviteLink: contact.invite_link,
      })
    );

    await supabase
      .from('emergency_contacts')
      .update({ whatsapp_invite_sent_at: new Date().toISOString() })
      .eq('id', contact.id);

    log('Invite sent', { contactId: contact.id });
  } catch (err) {
    logError('Failed to send WhatsApp invite:', { contactId: contact.id, message: err.message });
  }
};

const getContacts = async (userId) => {
  const query = supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId);

  const { data, error } = typeof query.order === 'function'
    ? await query.order('priority', { ascending: true }).order('created_at', { ascending: true })
    : await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

const createContact = async (userId, { contact_name, phone_number, relationship, priority }) => {
  const normalizedPhone = whatsappService.normalizePhoneNumber(phone_number);
  if (!normalizedPhone) {
    throw Object.assign(new Error('Invalid phone number'), { statusCode: 400 });
  }

  const existing = await getContacts(userId);
  if (existing.length >= contactsConfig.maxCount) {
    throw Object.assign(new Error(`Maximum of ${contactsConfig.maxCount} emergency contacts allowed`), { statusCode: 409 });
  }

  const normalizedExisting = existing.map((c) => whatsappService.normalizePhoneNumber(c.phone_number));
  if (normalizedExisting.includes(normalizedPhone)) {
    throw Object.assign(new Error('This contact already exists in your Guardian Circle'), { statusCode: 409 });
  }

  const inviteToken = generateInviteToken();

  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      contact_name,
      phone_number: `+${normalizedPhone}`,
      relationship,
      priority: priority || 3,
      invite_status: 'pending_invite',
      invite_token: inviteToken,
      invite_link: inviteLinkFor(inviteToken),
    })
    .select()
    .single();
  if (error) throw error;

  sendInvite(data, userId).catch((err) => logError('Invite dispatch failed:', err.message));

  return data;
};

const updateContact = async (userId, contactId, updates) => {
  const allowedUpdates = {};
  if (updates.contact_name !== undefined) allowedUpdates.contact_name = updates.contact_name;
  if (updates.relationship !== undefined) allowedUpdates.relationship = updates.relationship;
  if (updates.priority !== undefined) allowedUpdates.priority = updates.priority;

  if (updates.phone_number !== undefined) {
    const normalizedPhone = whatsappService.normalizePhoneNumber(updates.phone_number);
    if (!normalizedPhone) {
      throw Object.assign(new Error('Invalid phone number'), { statusCode: 400 });
    }

    const existing = (await getContacts(userId)).filter((c) => c.id !== contactId);
    const normalizedExisting = existing.map((c) => whatsappService.normalizePhoneNumber(c.phone_number));
    if (normalizedExisting.includes(normalizedPhone)) {
      throw Object.assign(new Error('This contact already exists in your Guardian Circle'), { statusCode: 409 });
    }

    allowedUpdates.phone_number = `+${normalizedPhone}`;
    allowedUpdates.invite_status = 'pending_invite';
    allowedUpdates.invite_token = generateInviteToken();
    allowedUpdates.invite_link = inviteLinkFor(allowedUpdates.invite_token);
    allowedUpdates.whatsapp_invite_sent_at = null;
    allowedUpdates.accepted_at = null;
    allowedUpdates.push_enabled = false;
    allowedUpdates.push_token = null;
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .update(allowedUpdates)
    .eq('id', contactId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;

  if (updates.phone_number !== undefined && data) {
    sendInvite(data, userId).catch((err) => logError('Invite dispatch failed:', err.message));
  }

  return data;
};

const deleteContact = async (userId, contactId) => {
  let query = supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', contactId);

  if (typeof query.eq === 'function') {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
  if (error) throw error;
};

const resendInvite = async (userId, contactId) => {
  const { data: contact, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  if (!contact) throw Object.assign(new Error('Contact not found'), { statusCode: 404 });

  await sendInvite(contact, userId);

  const { data: updated, error: fetchError } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('id', contactId)
    .single();
  if (fetchError) throw fetchError;
  return updated;
};

module.exports = { getContacts, createContact, updateContact, deleteContact, resendInvite };
