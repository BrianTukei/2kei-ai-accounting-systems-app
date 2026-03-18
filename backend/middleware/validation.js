const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validation middleware for additional security checks
 */

// Sanitize and validate common fields
const sanitizeInput = (req, res, next) => {
  // Remove potential XSS from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .trim();
  };

  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  next();
};

// Validate pagination parameters
const validatePagination = [
  (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Validate page
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive integer'
      });
    }

    // Validate limit (max 100 for performance)
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    req.query.page = page;
    req.query.limit = limit;
    next();
  }
];

// Validate MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

// Validate sort parameters
const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    const { sortBy, sortOrder } = req.query;
    
    if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
      });
    }
    
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Sort order must be either "asc" or "desc"'
      });
    }
    
    next();
  };
};

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

// Validate email format with additional checks
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom(value => {
      // Block common disposable email domains
      const disposableDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
        'mailinator.com', 'throwaway.email', 'yopmail.com'
      ];
      const domain = value.split('@')[1]?.toLowerCase();
      
      if (disposableDomains.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      
      return true;
    })
];

// Validate password strength
const validatePassword = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Validate file upload
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size must be less than 10MB'
    });
  }
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'File type not allowed. Allowed types: JPEG, PNG, GIF, PDF'
    });
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  validatePagination,
  validateObjectId,
  validateSort,
  handleValidationErrors,
  validateEmail,
  validatePassword,
  validateFileUpload
};
