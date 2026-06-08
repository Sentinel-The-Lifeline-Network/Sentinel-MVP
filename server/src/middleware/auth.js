const supabase = require('../config/supabase');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Missing or invalid authorization header', 401);
  }

  const token = authHeader.split(' ')[1];

  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data?.user) {
    return error(res, 'Invalid or expired token', 401);
  }

  req.user = data.user;
  next();
};

module.exports = { authenticate };
