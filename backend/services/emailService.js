const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email Service
 * Handles sending emails using Nodemailer with Gmail/SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      // Use Gmail service if no custom SMTP config
      if (!process.env.SMTP_HOST) {
        config.service = 'gmail';
        delete config.host;
        delete config.port;
        delete config.secure;
      }

      this.transporter = nodemailer.createTransporter(config);
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service initialization failed:', error);
          console.warn('Email service not available. Check SMTP credentials.');
        } else {
          logger.info('Email service initialized successfully');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Send email to single recipient
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} message - Email message (HTML)
   * @param {string} textMessage - Plain text version
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(to, subject, message, textMessage = null) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not available');
      }

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || '2K AI Accounting'}" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: message,
        text: textMessage || this.stripHtml(message)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
        subject: subject
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
        subject: subject
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message,
        recipient: to,
        subject: subject
      };
    }
  }

  /**
   * Send bulk emails
   * @param {Array} recipients - Array of email addresses
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @returns {Promise<Array>} Array of send results
   */
  async sendBulkEmails(recipients, subject, message) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient, subject, message);
        results.push(result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          recipient: recipient,
          subject: subject
        });
      }
    }

    return results;
  }

  /**
   * Send welcome email
   * @param {Object} user - User object
   * @param {Object} company - Company object
   */
  async sendWelcomeEmail(user, company) {
    const subject = 'Welcome to 2K AI Accounting System';
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to 2K AI Accounting!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your smart accounting solution is ready</p>
        </div>
        
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${user.firstName},</p>
          
          <p style="color: #666; line-height: 1.6;">
            Welcome to 2K AI Accounting! We're excited to have you on board. 
            Your company <strong>${company.name}</strong> has been successfully set up.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Quick Start Guide:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>📊 View your dashboard for an overview</li>
              <li>💰 Add your first transaction</li>
              <li>📧 Send your first invoice</li>
              <li>📈 Generate financial reports</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>This email was sent to ${user.email}. If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, message);
  }

  /**
   * Send payment reminder
   * @param {Object} user - User object
   * @param {Object} subscription - Subscription object
   */
  async sendPaymentReminder(user, subscription) {
    const subject = 'Payment Reminder - 2K AI Accounting';
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 40px; text-align: center;">
          <h2 style="color: #333; margin: 0;">Payment Reminder</h2>
        </div>
        
        <div style="padding: 40px; background: white;">
          <p>Hi ${user.firstName},</p>
          
          <p>This is a friendly reminder that your subscription payment is due.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Plan:</strong> ${subscription.planDetails.name}</p>
            <p><strong>Amount:</strong> $${subscription.planDetails.price}/${subscription.planDetails.billingCycle}</p>
            <p><strong>Due Date:</strong> ${new Date(subscription.currentPeriod.end).toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Update Payment Method
            </a>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, message);
  }

  /**
   * Send subscription expiry warning
   * @param {Object} user - User object
   * @param {Object} subscription - Subscription object
   * @param {number} daysRemaining - Days until expiry
   */
  async sendExpiryWarning(user, subscription, daysRemaining) {
    const subject = `Your Subscription Expires in ${daysRemaining} Days`;
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fff3cd; padding: 40px; text-align: center; border: 1px solid #ffeaa7;">
          <h2 style="color: #856404; margin: 0;">⚠️ Subscription Expiring Soon</h2>
        </div>
        
        <div style="padding: 40px; background: white;">
          <p>Hi ${user.firstName},</p>
          
          <p>Your subscription will expire in <strong>${daysRemaining} days</strong>.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Current Plan:</strong> ${subscription.planDetails.name}</p>
            <p><strong>Expiry Date:</strong> ${new Date(subscription.currentPeriod.end).toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" 
               style="background: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Renew Subscription
            </a>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, message);
  }

  /**
   * Strip HTML tags for plain text version
   * @private
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email service not initialized' };
      }

      await this.transporter.verify();
      return { success: true, message: 'Email service is working' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
