const supabase = require('../config/supabase');

const getContacts = async (userId) => {
  const query = supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId);

  const { data, error } = typeof query.order === 'function'
    ? await query.order('created_at', { ascending: true })
    : await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

const createContact = async (userId, contactData) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({ ...contactData, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateContact = async (userId, contactId, updates) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .update(updates)
    .eq('id', contactId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
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

module.exports = { getContacts, createContact, updateContact, deleteContact };
