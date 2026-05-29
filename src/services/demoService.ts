import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import { OWNER_EMAILS } from '../lib/adminEmails';

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_FROM || SMTP_USER || 'no-reply@2kai.com';

const transporter = nodemailer.createTransport(
  process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
      }
    : {
        service: 'gmail',
        auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
      }
);

interface DemoBooking {
  _id: string;
  name: string;
  email: string;
  company: string;
  preferredDate: Date;
  preferredTime: string;
  timezone: string;
  status: string;
  meetingLink?: string;
  meetingPlatform?: string;
}

/**
 * Send demo booking confirmation to user
 */
export const sendDemoConfirmation = async (booking: DemoBooking) => {
  try {
    const subject = 'Demo Booking Confirmed - 2K AI Accounting Systems';
    
    const message = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Booking Confirmation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .booking-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #666;
        }
        .value {
            color: #333;
            font-weight: 500;
        }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🤖 2K AI Accounting</div>
        <h1>Demo Booking Confirmed! 🎉</h1>
    </div>
    
    <div class="content">
        <p>Hi ${booking.name},</p>
        
        <p>Thank you for booking a demo with 2K AI Accounting Systems! We're excited to show you how our AI-powered accounting solution can transform your business.</p>
        
        <div class="booking-details">
            <h3>📅 Booking Details</h3>
            <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(booking.preferredDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</span>
            </div>
            <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${booking.preferredTime} ${booking.timezone || 'UTC'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Company:</span>
                <span class="value">${booking.company}</span>
            </div>
            <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">✅ Pending Confirmation</span>
            </div>
        </div>
        
        <h3>🎯 What to Expect</h3>
        <ul>
            <li>Personalized walkthrough of our AI accounting features</li>
            <li>Live demonstration of automated bookkeeping</li>
            <li>Q&A session with our product experts</li>
            <li>Custom pricing discussion for your business</li>
        </ul>
        
        <h3>📋 How to Prepare</h3>
        <ul>
            <li>Have your current accounting challenges ready</li>
            <li>Prepare any questions about AI automation</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Test your microphone and camera (optional)</li>
        </ul>
        
        <p><strong>📱 Meeting Link:</strong> We'll send the meeting link 24 hours before your demo.</p>
        
        <div style="text-align: center;">
            <a href="https://2kei.com/demo-prep" class="cta-button">Prepare for Your Demo</a>
        </div>
        
        <p>If you need to reschedule or have any questions, simply reply to this email or call us at +1-555-0123.</p>
        
        <p>We look forward to showing you the future of accounting! 🚀</p>
        
        <div class="footer">
            <p>Best regards,<br>The 2K AI Accounting Team</p>
            <p style="font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email for support.
            </p>
        </div>
    </div>
</body>
</html>
      `;

    if (SMTP_USER && SMTP_PASS) {
      const info = await transporter.sendMail({
        from: `"2K AI Accounting Systems" <${FROM_EMAIL}>`,
        to: booking.email,
        subject,
        html: message
      });
      logger.info(`Demo confirmation sent to ${booking.email}`, {
        bookingId: booking._id,
        subject,
        messageId: info.messageId
      });
      return { success: true, messageId: info.messageId };
    } else {
      logger.warn(`Mock: Demo confirmation sent to ${booking.email} (Email not configured)`, {
        bookingId: booking._id,
        subject
      });
      return { success: true, messageId: 'mock-message-id' };
    }
  } catch (error) {
    logger.error('Failed to send demo confirmation:', error);
    throw error;
  }
};

/**
 * Send demo booking notification to admin
 */
export const sendDemoNotification = async (booking: DemoBooking) => {
  try {
    const subject = `🎯 New Demo Booking: ${booking.company}`;
    
    const message = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Demo Booking</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .booking-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #666;
        }
        .value {
            color: #333;
            font-weight: 500;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            flex: 1;
        }
        .btn-primary {
            background: #28a745;
            color: white;
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 New Demo Booking!</h1>
        <p>A potential customer wants to see 2K AI Accounting in action</p>
    </div>
    
    <div class="content">
        <div class="booking-details">
            <h3>📋 Customer Information</h3>
            <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">${booking.name}</span>
            </div>
            <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">${booking.email}</span>
            </div>
            <div class="detail-row">
                <span class="label">Company:</span>
                <span class="value">${booking.company}</span>
            </div>
        </div>
        
        <div class="booking-details">
            <h3>📅 Booking Details</h3>
            <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(booking.preferredDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</span>
            </div>
            <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${booking.preferredTime} ${booking.timezone || 'UTC'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">🟡 Pending</span>
            </div>
            <div class="detail-row">
                <span class="label">Booking ID:</span>
                <span class="value">${booking._id}</span>
            </div>
        </div>
        
        <h3>🚀 Next Steps</h3>
        <ol>
            <li>Review the booking details above</li>
            <li>Check your availability for the requested time</li>
            <li>Confirm or reschedule the booking</li>
            <li>Send meeting link to the customer</li>
            <li>Prepare personalized demo content</li>
        </ol>
        
        <div class="action-buttons">
            <a href="https://2kei.com/admin/demo-bookings/${booking._id}" class="btn btn-primary">
                👁️ View Booking
            </a>
            <a href="https://2kei.com/admin/demo-bookings" class="btn btn-secondary">
                📋 All Bookings
            </a>
        </div>
    </div>
</body>
</html>
      `;

    if (SMTP_USER && SMTP_PASS) {
      // Send to all owners
      const toEmails = OWNER_EMAILS.join(', ');
      const info = await transporter.sendMail({
        from: `"2K AI Accounting Systems" <${FROM_EMAIL}>`,
        to: toEmails,
        subject,
        html: message
      });
      logger.info(`Demo notification sent to admin emails (${toEmails})`, {
        bookingId: booking._id,
        customerEmail: booking.email,
        subject,
        messageId: info.messageId
      });
      return { success: true, messageId: info.messageId };
    } else {
      logger.warn(`Mock: Demo notification logged to admin (Email not configured)`, {
        bookingId: booking._id,
        customerEmail: booking.email,
        subject
      });
      return { success: true, messageId: 'mock-message-id' };
    }
  } catch (error) {
    logger.error('Failed to send demo notification:', error);
    throw error;
  }
};

/**
 * Send booking status update to user
 */
export const sendBookingStatusUpdate = async (booking: DemoBooking) => {
  try {
    let subject, message;

    switch (booking.status) {
      case 'confirmed':
        subject = 'Demo Confirmed - 2K AI Accounting Systems';
        message = generateConfirmedEmail(booking);
        break;
      case 'cancelled':
        subject = 'Demo Cancelled - 2K AI Accounting Systems';
        message = generateCancelledEmail(booking);
        break;
      case 'completed':
        subject = 'Thank You - 2K AI Accounting Demo';
        message = generateCompletedEmail(booking);
        break;
      default:
        return; // No email for other statuses
    }

    if (SMTP_USER && SMTP_PASS) {
      const info = await transporter.sendMail({
        from: `"2K AI Accounting Systems" <${FROM_EMAIL}>`,
        to: booking.email,
        subject,
        html: message
      });
      logger.info(`Status update sent to ${booking.email}`, {
        bookingId: booking._id,
        status: booking.status,
        subject,
        messageId: info.messageId
      });
      return { success: true, messageId: info.messageId };
    } else {
      logger.warn(`Mock: Status update sent to ${booking.email} (Email not configured)`, {
        bookingId: booking._id,
        status: booking.status,
        subject
      });
      return { success: true, messageId: 'mock-message-id' };
    }
  } catch (error) {
    logger.error('Failed to send status update:', error);
    throw error;
  }
};

/**
 * Send reschedule notification
 */
export const sendRescheduleNotification = async (booking: DemoBooking, oldDateTime: string) => {
  try {
    const subject = 'Demo Rescheduled - 2K AI Accounting Systems';
    
    const message = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Rescheduled</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .booking-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        .old-time {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            text-decoration: line-through;
            color: #856404;
        }
        .new-time {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📅 Demo Rescheduled</h1>
        <p>Your demo booking time has been updated</p>
    </div>
    
    <div class="content">
        <p>Hi ${booking.name},</p>
        
        <p>Your demo booking has been rescheduled. Here are the updated details:</p>
        
        <div class="old-time">
            <strong>⏰ Previous Time:</strong><br>
            ${oldDateTime}
        </div>
        
        <div class="new-time">
            <strong>✅ New Time:</strong><br>
            ${new Date(booking.preferredDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })} at ${booking.preferredTime} ${booking.timezone || 'UTC'}
        </div>
        
        <p>If this new time doesn't work for you, please reply to this email or call us at +1-555-0123.</p>
        
        <p>We look forward to showing you 2K AI Accounting! 🚀</p>
    </div>
</body>
</html>
      `;

    if (SMTP_USER && SMTP_PASS) {
      const info = await transporter.sendMail({
        from: `"2K AI Accounting Systems" <${FROM_EMAIL}>`,
        to: booking.email,
        subject,
        html: message
      });
      logger.info(`Reschedule notification sent to ${booking.email}`, {
        bookingId: booking._id,
        messageId: info.messageId
      });
      return { success: true, messageId: info.messageId };
    } else {
      logger.warn(`Mock: Reschedule notification sent to ${booking.email} (Email not configured)`, {
        bookingId: booking._id,
        messageId: 'mock-message-id'
      });
      return { success: true, messageId: 'mock-message-id' };
    }
  } catch (error) {
    logger.error('Failed to send reschedule notification:', error);
    throw error;
  }
};

/**
 * Generate confirmed email template
 */
function generateConfirmedEmail(booking: DemoBooking): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Confirmed</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .meeting-link { background: #e7f5ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Demo Confirmed!</h1>
        <p>Your demo has been confirmed</p>
    </div>
    
    <div class="content">
        <p>Hi ${booking.name},</p>
        
        <p>Great news! Your demo has been confirmed. Here are your meeting details:</p>
        
        <div class="meeting-link">
            <strong>📅 Date:</strong> ${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
            <strong>⏰ Time:</strong> ${booking.preferredTime} ${booking.timezone || 'UTC'}<br>
            <strong>🔗 Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a><br>
            <strong>💻 Platform:</strong> ${booking.meetingPlatform || 'Zoom'}
        </div>
        
        <p>We'll send you a reminder 24 hours before the demo. Make sure to test your audio/video setup beforehand.</p>
        
        <div style="text-align: center;">
            <a href="${booking.meetingLink}" class="btn">Join Meeting</a>
        </div>
        
        <p>See you soon! 🚀</p>
    </div>
</body>
</html>
  `;
}

/**
 * Generate cancelled email template
 */
function generateCancelledEmail(booking: DemoBooking): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Cancelled</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .reschedule { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .btn { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>❌ Demo Cancelled</h1>
        <p>Your demo booking has been cancelled</p>
    </div>
    
    <div class="content">
        <p>Hi ${booking.name},</p>
        
        <p>Your demo booking has been cancelled. If you didn't request this cancellation, please contact us immediately.</p>
        
        <div class="reschedule">
            <strong>📅 Want to reschedule?</strong><br>
            You can book a new demo at any time using the link below.
        </div>
        
        <div style="text-align: center;">
            <a href="https://2kei.com/demo" class="btn">Book New Demo</a>
        </div>
        
        <p>If you have any questions, please don't hesitate to reach out.</p>
    </div>
</body>
</html>
  `;
}

/**
 * Generate completed email template
 */
function generateCompletedEmail(booking: DemoBooking): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - Demo Completed</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .next-steps { background: #e7f5ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Thank You!</h1>
        <p>Thanks for attending our demo</p>
    </div>
    
    <div class="content">
        <p>Hi ${booking.name},</p>
        
        <p>Thank you for attending the 2K AI Accounting demo! We hope you found it valuable and informative.</p>
        
        <div class="next-steps">
            <strong>🚀 Next Steps:</strong><br>
            1. Check your email for the demo recording<br>
            2. Review the personalized proposal we sent<br>
            3. Schedule a follow-up call if needed<br>
            4. Start your free trial when ready
        </div>
        
        <p>Our team will follow up with you shortly to answer any additional questions and help you get started.</p>
        
        <div style="text-align: center;">
            <a href="https://2kei.com/trial" class="btn">Start Free Trial</a>
        </div>
        
        <p>We're excited to partner with you on your accounting automation journey! 🚀</p>
    </div>
</body>
</html>
  `;
}
