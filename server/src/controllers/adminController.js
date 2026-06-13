const adminService = require('../services/adminService');
const { success } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    success(res, stats);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
