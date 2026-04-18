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
    await emailService.sendEmail(email, subject, message);
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
  
  for (const email of emails) {
    try {
      await emailService.sendEmail(email, subject, message);
      await EmailLog.create({
        email,
        subject,
        status: "Success"
      });
      successCount++;
      
      // Update progress roughly every 10 emails or at the end
      if (successCount % 10 === 0 || successCount === emails.length) {
         job.progress(Math.floor((successCount / emails.length) * 100));
      }
    } catch (error) {
      await EmailLog.create({
        email,
        subject,
        status: "Failure",
        error: error.message || "Failed to send broadcast email"
      });
      logger.error(`Broadcast sending failed for ${email}: ${error.message}`);
    }
    
    // Optional delay to prevent rate-limiting from email provider
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Update broadcast record in Supabase
  if (supabase && broadcastId) {
    await supabase.from('broadcasts').update({
      status: 'sent',
      sent_count: successCount
    }).eq('id', broadcastId);
  }
  
  return { successCount, totalEmails: emails.length };
});

