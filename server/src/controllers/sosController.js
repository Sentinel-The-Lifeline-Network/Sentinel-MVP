const sosService = require('../services/sosService');
const locationService = require('../services/locationService');
const { verifyPin } = require('../utils/hashPin');
const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');

const triggerSOS = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const alert = await sosService.triggerSOS(req.user.id, { latitude, longitude });
    success(res, alert, 201);
  } catch (err) {
    if (err.statusCode === 409) return error(res, err.message, 409);
    next(err);
  }
};

const getActiveAlert = async (req, res, next) => {
  try {
    const alert = await sosService.getActiveAlert(req.user.id);
    success(res, alert);
  } catch (err) {
    next(err);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body;
    await locationService.updateAlertLocation(alertId, req.user.id, {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
    });
    success(res, { message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

const markSafe = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { pin } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('security_pin_hash')
      .eq('id', req.user.id)
      .single();

    if (user?.security_pin_hash) {
      const valid = await verifyPin(pin, user.security_pin_hash);
      if (!valid) return error(res, 'Invalid security PIN', 401);
    }

    const alert = await sosService.markSafe(alertId, req.user.id);
    success(res, alert);
  } catch (err) {
    if (err.statusCode === 404) return error(res, err.message, 404);
    next(err);
  }
};

const stopAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { pin } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('security_pin_hash')
      .eq('id', req.user.id)
      .single();

    if (user?.security_pin_hash) {
      const valid = await verifyPin(pin, user.security_pin_hash);
      if (!valid) return error(res, 'Invalid security PIN', 401);
    }

    const alert = await sosService.stopAlert(alertId, req.user.id);
    success(res, alert);
  } catch (err) {
    if (err.statusCode === 404) return error(res, err.message, 404);
    next(err);
  }
};

const getAlertHistory = async (req, res, next) => {
  try {
    const data = await sosService.getAlertHistory(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const alert = await sosService.getAlertById(req.params.id, req.user.id);
    if (!alert) return error(res, 'Alert not found', 404);
    success(res, alert);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  triggerSOS,
  getActiveAlert,
  updateLocation,
  markSafe,
  stopAlert,
  getAlertHistory,
  getAlertById,
};
