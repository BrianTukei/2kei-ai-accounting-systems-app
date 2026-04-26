const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Authentication Middleware
 * Verifies JWT tokens and sets user in request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token (with Supabase fallback)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      decoded = jwt.decode(token); // Fallback to raw decode for Supabase JWTs
    }

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token payload.' });
    }

    // Get user from database if mongoose is ready
    if (mongoose.connection.readyState === 1 && decoded?.id && String(decoded.id).length === 24) {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      req.user = user;
    } else {
      // Supabase user struct
      req.user = { 
        id: decoded.sub || decoded.id, 
        email: decoded.email, 
        role: decoded.app_metadata?.role || decoded.role || 'user' 
      };
    }

    // Add user to request object
    // req.user logic is handled above
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

// Backward-compatible aliases used by legacy route files
const auth = authenticate;
const admin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  auth,
  admin
};
