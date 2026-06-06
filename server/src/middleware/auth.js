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

const authenticateResponder = async (req, res, next) => {
  await authenticate(req, res, async () => {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!profile || profile.role !== 'responder') {
      return error(res, 'Responder access required', 403);
    }
    next();
  });
};

module.exports = { authenticate, authenticateResponder };
