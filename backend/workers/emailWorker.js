const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { connection } = require('../queues/emailQueue');
const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');

// Init Supabase for updating logs
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (email, subject, htmlMessage, broadcastId) => {
  try {
    const info = await transporter.sendMail({
      from: `"2K AI Accounting" <${process.env.FROM_EMAIL || 'no-reply@2kai.com'}>`,
      to: email,
      subject: subject,
      html: htmlMessage
    });
    
    // Additional logging or updating 'sent' rows can go here
    return info;
  } catch (error) {
    logger.error(`Error sending to \${email}`, { error: error.message });
    throw error;
  }
};

const emailWorker = new Worker('EmailCampaignQueue', async job => {
  // Extract details
  const { emails, subject, message, broadcastId } = job.data;
  logger.info(`Processing Broadcast Job \${job.id} for \${emails.length} recipients...`);

  let successCount = 0;
  let failCount = 0;

  for (const email of emails) {
    // Add unsub link logic natively
    const unsubLink = `\${process.env.FRONTEND_URL}/unsubscribe?email=\${encodeURIComponent(email)}`;
    const finalHtml = `\${message}<br><br><small><a href="\${unsubLink}">Unsubscribe from these emails</a></small>`;

    try {
      await sendEmail(email, subject, finalHtml, broadcastId);
      successCount++;
    } catch(err) {
      failCount++;
    }
  }

  // Update Supabase broadcast record with final counts and status
  if (broadcastId) {
    await supabase.from('broadcasts').update({
      status: 'sent',
      sent_count: successCount,
      // You could track bounces/failures similarly
    }).eq('id', broadcastId);
  }

  return { successCount, failCount };
}, { connection, concurrency: Math.min(5, 100) }); // Control throughput to avoid ban

emailWorker.on('completed', (job, returnvalue) => {
  logger.info(`Broadcast Job \${job.id} completed. Sent: \${returnvalue.successCount}, Failed: \${returnvalue.failCount}`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Broadcast Job \${job.id} failed`, { error: err.message });
});

module.exports = emailWorker;