const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
};

module.exports = {
  createRateLimiter
};
