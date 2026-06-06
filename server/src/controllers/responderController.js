const supabase = require('../config/supabase');
const locationService = require('../services/locationService');
const { success, error } = require('../utils/response');

const getAllActiveAlerts = async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('sos_alerts')
      .select('*, users(id, full_name, phone, email)')
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (dbError) throw dbError;
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('sos_alerts')
      .select('*, users(id, full_name, phone, email), alert_notifications(*), responder_actions(*)')
      .eq('id', req.params.id)
      .single();

    if (dbError) throw dbError;
    if (!data) return error(res, 'Alert not found', 404);

    const locationHistory = await locationService.getLocationHistory(req.params.id);
    success(res, { ...data, location_history: locationHistory });
  } catch (err) {
    next(err);
  }
};

const updateAlertStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['active', 'resolved', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return error(res, 'Invalid status value', 422);
    }

    const updates = { status };
    if (status !== 'active') updates.ended_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('sos_alerts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (dbError) throw dbError;

    if (note) {
      await supabase.from('responder_actions').insert({
        alert_id: req.params.id,
        responder_id: req.user.id,
        action: status,
        note,
      });
    }

    success(res, data);
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const { note } = req.body;
    const { data, error: dbError } = await supabase
      .from('sos_alerts')
      .update({ status: 'resolved', ended_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (dbError) throw dbError;

    await supabase.from('responder_actions').insert({
      alert_id: req.params.id,
      responder_id: req.user.id,
      action: 'resolved',
      note: note || 'Resolved by responder',
    });

    success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllActiveAlerts, getAlertById, updateAlertStatus, resolveAlert };
