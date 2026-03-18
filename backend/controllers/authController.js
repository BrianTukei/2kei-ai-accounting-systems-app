const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');
const { catchAsync, sendSuccess, sendError, handleValidationErrors } = require('../utils/errorHandler');

/**
 * Auth Controller
 * Handles user authentication, registration, and token management
 */
class AuthController {
  /**
   * Register new user with company
   * POST /api/auth/register
   */
  async register(req, res) {
    return catchAsync(async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Validation failed', 400, errors.array());
      }

      const { 
        firstName, 
        lastName, 
        email, 
        password, 
        phone,
        companyData 
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendError(res, 'User with this email already exists', 400);
      }

      // Check if this is the first user (should be admin)
      const userCount = await User.countDocuments();
      const isFirstUser = userCount === 0;
      
      // Create user (password will be hashed by User model pre-save hook)
      const user = new User({
        firstName,
        lastName,
        email,
        password, // Plain password - model will hash it
        phone,
        role: isFirstUser ? 'admin' : 'viewer', // First user is admin, others are viewers by default
        isActive: true,
        emailVerified: false
      });

      // Create company if provided
      if (companyData) {
        const company = new Company({
          ...companyData,
          owner: user._id,
          members: [{
            user: user._id,
            role: 'admin',
            joinedAt: new Date()
          }]
        });

        await company.save();
        user.company = company._id;

        // Create free subscription
        const subscription = new Subscription({
          user: user._id,
          company: company._id,
          plan: 'free',
          planDetails: {
            name: 'Free Plan',
            price: 0,
            currency: companyData.baseCurrency?.code || 'USD',
            billingCycle: 'monthly',
            features: [
              'Basic accounting',
              'Up to 50 transactions/month',
              '1 user',
              'Basic reports'
            ],
            limits: {
              transactions: 50,
              invoices: 10,
              users: 1,
              storage: 100,
              aiRequests: 10
            }
          },
          status: 'active',
          currentPeriod: {
            start: new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });

        await subscription.save();
        user.subscription = subscription._id;
      }

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`New user registered: ${email}`);

      return sendSuccess(res, {
        user: userResponse,
        token
      }, 'User registered successfully', 201);
    })(req, res);
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user with company and subscription
      const user = await User.findOne({ email })
        .populate('company')
        .populate('subscription');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`User logged in: ${email}`);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .populate('company')
        .populate('subscription')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { firstName, lastName, phone } = req.body;
      const userId = req.user.id;

      const user = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, phone },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password (model will hash it)
      await User.findByIdAndUpdate(userId, { password: newPassword });

      logger.info(`Password changed for user: ${user.email}`);

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not active'
        });
      }

      // Generate new token
      const newToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.status(200).json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success
      logger.info(`User logged out: ${req.user.email}`);
      
      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
  }
}

module.exports = new AuthController();
