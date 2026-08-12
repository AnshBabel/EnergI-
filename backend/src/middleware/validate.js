export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.validated = parsed;
    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ error: `Invalid request payload: ${details}` });
    }
    return res.status(400).json({ error: 'Malformed or invalid request data' });
  }
};
