const User = require('../models/User');
const EmailLog = require('../models/EmailLog');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Admin Controller
 * Handles admin messaging and user management
 */
class AdminController {
  /**
   * Get all registered users
   * GET /api/admin/users
   */
  async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        role = '', 
        isActive = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (role) {
        query.role = role;
      }
      
      if (isActive !== '') {
        query.isActive = isActive === 'true';
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get users and count
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .populate('company', 'name baseCurrency.code')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments(query)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id)
        .select('-password')
        .populate('company', 'name baseCurrency address')
        .populate('subscription', 'plan status currentPeriod')
        .lean();

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
      logger.error('Error fetching user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      });
    }
  }

  /**
   * Send email to user(s)
   * POST /api/admin/send-email
   */
  async sendEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId, emails, subject, message, type = 'admin_message' } = req.body;
      const adminId = req.user.id;

      let recipients = [];
      let userIds = [];

      // Handle single user by ID
      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        recipients.push(user.email);
        userIds.push(user._id);
      }

      // Handle multiple emails
      if (emails && Array.isArray(emails)) {
        recipients = [...recipients, ...emails];
        
        // Find users for provided emails
        const users = await User.find({ email: { $in: emails } });
        userIds = [...userIds, ...users.map(u => u._id)];
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No recipients specified'
        });
      }

      // Generate bulk ID for tracking
      const bulkId = recipients.length > 1 ? uuidv4() : null;

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      // Send emails
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const userId = userIds[i] || null;

        try {
          const result = await emailService.sendEmail(recipient, subject, message);
          
          // Log email
          const emailLog = new EmailLog({
            messageId: result.messageId || uuidv4(),
            recipient,
            subject,
            message,
            admin: adminId,
            userId,
            status: result.success ? 'sent' : 'failed',
            type,
            bulkId,
            providerMessageId: result.messageId,
            error: result.success ? null : {
              message: result.error
            }
          });

          await emailLog.save();

          results.push({
            recipient,
            success: result.success,
            error: result.error,
            messageId: result.messageId
          });

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          logger.error('Failed to send email to recipient:', error);
          
          // Log failed email
          const emailLog = new EmailLog({
            messageId: uuidv4(),
            recipient,
            subject,
            message,
            admin: adminId,
            userId,
            status: 'failed',
            type,
            bulkId,
            error: {
              message: error.message
            }
          });

          await emailLog.save();

          results.push({
            recipient,
            success: false,
            error: error.message
          });
          failureCount++;
        }
      }

      logger.info(`Admin email campaign completed`, {
        adminId,
        bulkId,
        totalRecipients: recipients.length,
        successCount,
        failureCount
      });

      return res.status(200).json({
        success: true,
        message: `Email sent successfully to ${successCount} recipient${successCount !== 1 ? 's' : ''}${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
        data: {
          bulkId,
          results,
          summary: {
            total: recipients.length,
            success: successCount,
            failed: failureCount
          }
        }
      });
    } catch (error) {
      logger.error('Error sending admin email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email'
      });
    }
  }

  /**
   * Get email logs
   * GET /api/admin/email-logs
   */
  async getEmailLogs(req, res) {
    try {
      const { page = 1, limit = 20, status, type, bulkId } = req.query;
      const adminId = req.user.id;

      const history = await EmailLog.getAdminHistory(adminId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type
      });

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching email logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch email logs'
      });
    }
  }

  /**
   * Get bulk email details
   * GET /api/admin/bulk-email/:bulkId
   */
  async getBulkEmailDetails(req, res) {
    try {
      const { bulkId } = req.params;

      const details = await EmailLog.getBulkEmailDetails(bulkId);

      if (!details.emails.length) {
        return res.status(404).json({
          success: false,
          message: 'Bulk email not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      logger.error('Error fetching bulk email details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bulk email details'
      });
    }
  }

  /**
   * Get email statistics
   * GET /api/admin/email-stats
   */
  async getEmailStatistics(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const stats = await EmailLog.getStatistics({
        createdAt: { $gte: startDate }
      });

      return res.status(200).json({
        success: true,
        data: {
          period,
          stats,
          totalSent: stats.reduce((sum, stat) => sum + stat.count, 0)
        }
      });
    } catch (error) {
      logger.error('Error fetching email statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch email statistics'
      });
    }
  }

  /**
   * Test email configuration
   * POST /api/admin/test-email
   */
  async testEmail(req, res) {
    try {
      const result = await emailService.testConnection();
      
      return res.status(200).json({
        success: result.success,
        message: result.message || result.error
      });
    } catch (error) {
      logger.error('Error testing email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to test email configuration'
      });
    }
  }
}

module.exports = new AdminController();
