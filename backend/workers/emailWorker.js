const emailQueue = require("../queues/emailQueue");
const emailService = require("../services/emailService");
const EmailLog = require("../models/EmailLog");
const { createClient } = require('@supabase/supabase-js');
const logger = require("../utils/logger");

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabase = hasSupabaseConfig ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY) : null;

emailQueue.process(async (job) => {
  const { email, subject, message } = job.data;
  try {
    const sendResult = await emailService.sendEmail(email, subject, message);
    if (!sendResult?.success) {
      throw new Error(sendResult?.error || "Failed to send email");
    }
    await EmailLog.create({
      email,
      subject,
      status: "Success"
    });
  } catch (error) {
    await EmailLog.create({
      email,
      subject,
      status: "Failure",
      error: error.message || "Failed to send email"
    });
    throw error;
  }
});

// Process broadcast campaigns
emailQueue.process('send_broadcast', async (job) => {
  const { broadcastId, subject, message, emails } = job.data;
  if (!emails || emails.length === 0) return;
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const email of emails) {
    try {
      const sendResult = await emailService.sendEmail(email, subject, message);
      if (!sendResult?.success) {
        throw new Error(sendResult?.error || "Failed to send broadcast email");
      }
      await EmailLog.create({
        email,
        subject,
        status: "Success"
      });
      successCount++;
    } catch (error) {
      failureCount++;
      await EmailLog.create({
        email,
        subject,
        status: "Failure",
        error: error.message || "Failed to send broadcast email"
      });
      logger.error(`Broadcast sending failed for ${email}: ${error.message}`);
    }

    const processedCount = successCount + failureCount;
    if (processedCount % 10 === 0 || processedCount === emails.length) {
      job.progress(Math.floor((processedCount / emails.length) * 100));
    }
    
    // Optional delay to prevent rate-limiting from email provider
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Update broadcast record in Supabase
  if (supabase && broadcastId) {
    await supabase.from('broadcasts').update({
      status: failureCount > 0 ? (successCount > 0 ? 'partially_sent' : 'failed') : 'sent',
      sent_count: successCount
    }).eq('id', broadcastId);
  }
  
  return { successCount, failureCount, totalEmails: emails.length };
});
