function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  // PostgreSQL unique_violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry. That value already exists.' });
  }
  // PostgreSQL foreign_key_violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
