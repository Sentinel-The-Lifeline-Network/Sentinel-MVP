const supabase = require('../config/supabase');

const getContactByToken = async (token) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const getInviteByToken = async (token) => {
  const contact = await getContactByToken(token);
  if (!contact) throw Object.assign(new Error('Invite not found'), { statusCode: 404 });

  const { data: inviter } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', contact.user_id)
    .maybeSingle();

  return {
    contactName: contact.contact_name,
    userName: inviter?.full_name || 'A Sentinel user',
    status: contact.invite_status,
  };
};

const acceptInvite = async (token) => {
  const contact = await getContactByToken(token);
  if (!contact) throw Object.assign(new Error('Invite not found'), { statusCode: 404 });

  if (contact.invite_status === 'pending_invite' || contact.invite_status === 'whatsapp_only') {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update({ invite_status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', contact.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  return contact;
};

const registerPushToken = async (token, pushToken) => {
  const contact = await getContactByToken(token);
  if (!contact) throw Object.assign(new Error('Invite not found'), { statusCode: 404 });

  const { data, error } = await supabase
    .from('emergency_contacts')
    .update({ push_token: pushToken, push_enabled: true, invite_status: 'push_enabled' })
    .eq('id', contact.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const disablePush = async (token) => {
  const contact = await getContactByToken(token);
  if (!contact) throw Object.assign(new Error('Invite not found'), { statusCode: 404 });

  const { data, error } = await supabase
    .from('emergency_contacts')
    .update({ push_enabled: false, invite_status: 'push_disabled' })
    .eq('id', contact.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { getInviteByToken, acceptInvite, registerPushToken, disablePush };
