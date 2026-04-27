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
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      
      if (!emailUser || !emailPass) {
        logger.warn('Email credentials (EMAIL_USER or EMAIL_PASS) not configured. Email service will run in mock mode.');
        this.transporter = null;
        return;
      }

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

      this.transporter = nodemailer.createTransport(config);
      
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
        logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        return { messageId: 'mock-id' };
      }

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || '2K AI Accounting Systems'}" <${process.env.EMAIL_USER}>`,
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

  // ─────────────────────────────────────────
  // BILLING-SPECIFIC EMAIL TEMPLATES
  // ─────────────────────────────────────────

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(email, payment, plan) {
    const subject = '✅ Payment Confirmation - 2K AI Accounting';
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Payment Confirmed ✓</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Hello,</p>
          <p>Thank you for your payment! Your subscription has been activated.</p>
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Amount:</strong> UGX ${payment.amount?.toLocaleString()}</p>
            <p><strong>Plan:</strong> ${plan?.name || 'Premium'}</p>
            <p><strong>Transaction ID:</strong> ${payment.transaction_reference}</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Subscription</a>
          </div>
        </div>
      </div>
    `;
    return await this.sendEmail(email, subject, message);
  }

  /**
   * Send usage warning email
   */
  async sendUsageWarning(email, used, limit, percentage) {
    const subject = `⚠️ Usage Limit Approaching - ${percentage}% Used`;
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Usage Limit Warning ⚠️</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Hello,</p>
          <p>You've used ${percentage}% of your monthly transaction limit.</p>
          <div style="background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h3 style="margin-top: 0;">Usage Status</h3>
            <div style="background: #e5e7eb; border-radius: 8px; height: 30px; margin: 15px 0;">
              <div style="background: #f59e0b; height: 100%; width: ${percentage}%; border-radius: 8px;"></div>
            </div>
            <p><strong>Used:</strong> ${used.toLocaleString()} / ${limit.toLocaleString()} transactions</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Upgrade Plan</a>
          </div>
        </div>
      </div>
    `;
    return await this.sendEmail(email, subject, message);
  }

  /**
   * Send demo booking confirmation to admin
   */
  async sendDemoBookingNotification(adminEmail, booking) {
    const subject = `🎉 New Demo Booking - ${booking.business_name}`;
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #667eea; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">New Demo Booking 🎉</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>You have a new demo booking request!</p>
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Business:</strong> ${booking.business_name}</p>
            <p><strong>Contact:</strong> ${booking.name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Phone:</strong> ${booking.phone}</p>
            <p><strong>Preferred Date:</strong> ${booking.preferred_date}</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/demo-bookings" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Booking</a>
          </div>
        </div>
      </div>
    `;
    return await this.sendEmail(adminEmail, subject, message);
  }

  /**
   * Send grace period notification
   */
  async sendGracePeriodStarted(email, graceUntil) {
    const subject = 'Your Plan Has Expired (Grace Period Active)';
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Grace Period Active</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Hello,</p>
          <p>Your subscription has expired, but you have a grace period to renew.</p>
          <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0;">Grace Period Information</h3>
            <p><strong>Valid Until:</strong> ${new Date(graceUntil).toLocaleDateString()}</p>
            <p>Service continues to work during this period. Renew before the grace period ends!</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing/payment" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Renew Now</a>
          </div>
        </div>
      </div>
    `;
    return await this.sendEmail(email, subject, message);
  }
}

// Export singleton instance
module.exports = new EmailService();
