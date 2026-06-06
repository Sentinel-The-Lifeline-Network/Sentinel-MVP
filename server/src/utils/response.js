const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

const error = (res, message, statusCode = 400, details = null) => {
  const body = { success: false, error: message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
