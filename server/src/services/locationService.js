const supabase = require('../config/supabase');

const updateAlertLocation = async (alertId, userId, { latitude, longitude, accuracy, speed, heading }) => {
  const now = new Date().toISOString();

  const [locationResult, alertResult] = await Promise.all([
    supabase.from('location_updates').insert({
      alert_id: alertId,
      latitude,
      longitude,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
    }),
    supabase
      .from('sos_alerts')
      .update({
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_timestamp: now,
      })
      .eq('id', alertId)
      .eq('user_id', userId),
  ]);

  if (locationResult.error) throw locationResult.error;
  if (alertResult.error) throw alertResult.error;
};

const getLocationHistory = async (alertId) => {
  const { data, error } = await supabase
    .from('location_updates')
    .select('*')
    .eq('alert_id', alertId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

module.exports = { updateAlertLocation, getLocationHistory };
