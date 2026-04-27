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
   * Get active user emails for broadcast selection
   * GET /api/admin/users/emails
   */
  async getUserEmails(req, res) {
    try {
      const users = await User.find({ isActive: true })
        .select('firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      const results = users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email
      }));

      return res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      logger.error('Error fetching user emails:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user emails'
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
        if (mongoose.connection.readyState === 1 && typeof userId === 'string' && userId.length === 24) {
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }
          recipients.push(user.email);
          userIds.push(user._id);
        } else {
          // If we can't look up by ID using Mongo, look for email fallback if provided
          logger.warn(`Skipping MongoDB ID lookup for ${userId} (offline or not Mongo ID)`);
        }
      }

      // Handle multiple emails
      if (emails && Array.isArray(emails)) {
        recipients = [...recipients, ...emails];
        
        try {
          // Attempt to find users if MongoDB is available
          if (mongoose.connection.readyState === 1) {
            const users = await User.find({ email: { $in: emails } });
            userIds = [...userIds, ...users.map(u => u._id)];
          }
        } catch (e) {
          logger.warn("Skipping MongoDB user lookup (Supabase active mode)");
        }
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No recipients specified'
        });
      }

      // Generate bulk ID for tracking
      const bulkId = recipients.length > 1 ? uuidv4() : null;

      // Send emails in parallel with proper error isolation
      const emailPromises = recipients.map(async (recipient, index) => {
        const uid = userIds[index] || null;
        
        try {
          const result = await emailService.sendEmail(recipient, subject, message);
          
          try {
            if (mongoose.connection.readyState === 1 && uid) {
              // Log email
              const emailLog = new EmailLog({
                messageId: result.messageId || uuidv4(),
                recipient,
                subject,
                message,
                admin: adminId,
                userId: uid,
                status: result.success ? 'sent' : 'failed',
                type,
                bulkId,
                providerMessageId: result.messageId,
                error: result.success ? null : {
                  message: result.error
                }
              });

              await emailLog.save();
            }
          } catch (e) {
             logger.warn('Skipping MongoDB email log save (Supabase active mode)');
          }

          return {
            recipient,
            success: result.success,
            error: result.error,
            messageId: result.messageId
          };
        } catch (error) {
          logger.error('Failed to send email to recipient:', error);
          
          try {
            if (mongoose.connection.readyState === 1 && uid) {
              // Log failed email
              const emailLog = new EmailLog({
                messageId: uuidv4(),
                recipient,
                subject,
                message,
                admin: adminId,
                userId: uid,
                status: 'failed',
                type,
                bulkId,
                error: {
                  message: error.message
                }
              });

              await emailLog.save();
            }
          } catch (e) {
             logger.warn('Skipping MongoDB email log save (Supabase active mode)');
          }

          return {
            recipient,
            success: false,
            error: error.message
          };
        }
      });

      // Wait for all emails to complete (whether successful or not)
      const results = await Promise.allSettled(emailPromises);
      
      // Extract results and count successes/failures
      const emailResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : {
          success: false,
          error: 'Promise rejected',
          recipient: 'unknown'
        }
      );
      
      const successCount = emailResults.filter(r => r.success).length;
      const failureCount = emailResults.filter(r => !r.success).length;

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
          results: emailResults,
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
