const supabase = require('../config/supabase');
const { hashPin } = require('../utils/hashPin');
const { success, error } = require('../utils/response');

const createProfile = async (req, res, next) => {
  try {
    const { full_name, phone, security_pin } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    const pinHash = security_pin ? await hashPin(security_pin) : null;

    const { data, error: dbError } = await supabase
      .from('users')
      .upsert({ id: userId, full_name, phone, email, security_pin_hash: pinHash })
      .select()
      .single();

    if (dbError) throw dbError;
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('users')
      .select('id, full_name, phone, email, created_at')
      .eq('id', req.user.id)
      .single();

    if (dbError) throw dbError;
    if (!data) return error(res, 'Profile not found', 404);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, security_pin } = req.body;
    const updates = { full_name, phone };
    if (security_pin) updates.security_pin_hash = await hashPin(security_pin);

    const { data, error: dbError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, full_name, phone, email, created_at')
      .single();

    if (dbError) throw dbError;
    success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { createProfile, getProfile, updateProfile };
