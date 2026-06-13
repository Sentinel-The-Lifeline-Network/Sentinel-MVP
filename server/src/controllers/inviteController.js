const inviteService = require('../services/inviteService');
const { success, error } = require('../utils/response');

const getInvite = async (req, res, next) => {
  try {
    const data = await inviteService.getInviteByToken(req.params.token);
    success(res, data);
  } catch (err) {
    if (err.statusCode === 404) return error(res, 'Invite not found', 404);
    next(err);
  }
};

const acceptInvite = async (req, res, next) => {
  try {
    const data = await inviteService.acceptInvite(req.params.token);
    success(res, data);
  } catch (err) {
    if (err.statusCode === 404) return error(res, 'Invite not found', 404);
    next(err);
  }
};

const registerPushToken = async (req, res, next) => {
  try {
    const data = await inviteService.registerPushToken(req.params.token, req.body.token);
    success(res, data);
  } catch (err) {
    if (err.statusCode === 404) return error(res, 'Invite not found', 404);
    next(err);
  }
};

module.exports = { getInvite, acceptInvite, registerPushToken };
