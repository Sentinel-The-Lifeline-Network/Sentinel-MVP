const supabase = require('../config/supabase');
const locationService = require('../services/locationService');
const { success, error } = require('../utils/response');

const getTrackingData = async (req, res, next) => {
  try {
    const { token } = req.params;

    const { data: alert, error: dbError } = await supabase
      .from('sos_alerts')
      .select('*, users(full_name)')
      .eq('tracking_token', token)
      .single();

    if (dbError || !alert) return error(res, 'Tracking link not found or expired', 404);

    const locationHistory = await locationService.getLocationHistory(alert.id);

    success(res, {
      id: alert.id,
      status: alert.status,
      started_at: alert.started_at,
      ended_at: alert.ended_at,
      last_latitude: alert.last_latitude,
      last_longitude: alert.last_longitude,
      last_location_timestamp: alert.last_location_timestamp,
      user_name: alert.users?.full_name || 'Unknown',
      location_history: locationHistory,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTrackingData };
