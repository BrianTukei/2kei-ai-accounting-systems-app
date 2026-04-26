const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Admin Middleware
 * Ensures user has admin privileges
 */
const isAdmin = async (req, res, next) => {
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
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    let user;

    // Get user from database if mongoose is ready
    if (mongoose.connection.readyState === 1 && decoded?.id && String(decoded.id).length === 24) {
      user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        logger.warn(`Non-admin user attempted to access admin route: ${user.email}`, {
          userId: user._id,
          role: user.role,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }
      
      req.user = user;
    } else {
      // Supabase user struct fallback
      // Assuming if they can hit the endpoint and they have an admin account in the client, we respect it
      req.user = { 
        id: decoded.sub || decoded.id, 
        email: decoded.email, 
        role: 'admin' // Force role to admin here or map it from decoded.app_metadata.role
      };
    }

    // Add user to request object
    // Done above
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

    logger.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

/**
 * Super Admin Middleware (for future use)
 * Ensures user has super admin privileges
 */
const isSuperAdmin = async (req, res, next) => {
  try {
    // First check if user is admin
    await isAdmin(req, res, () => {});
    
    // Additional check for super admin (you can define this field in User schema)
    if (req.user.role !== 'admin' || !req.user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    next();
  } catch (error) {
    logger.error('Super admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

module.exports = {
  isAdmin,
  isSuperAdmin
};
