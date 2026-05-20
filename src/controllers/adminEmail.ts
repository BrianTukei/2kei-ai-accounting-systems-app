import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/loggerService';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
let supabase: any = null;

// Only initialize Supabase client if credentials are available
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_FROM || SMTP_USER || 'no-reply@2kai.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || '2K AI Accounting Systems';

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

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase service credentials are not configured');
  }
}

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function uniqueEmails(emails: unknown[]): string[] {
  return [...new Set(emails.map(normalizeEmail).filter(Boolean) as string[])];
}

async function getSubscriberEmails(): Promise<string[]> {
  ensureSupabase();

  const { data, error } = await supabase
    .from('subscribers')
    .select('email')
    .eq('status', 'active');

  if (error) {
    logger.warn(`Unable to load subscribers for broadcast: ${error.message}`);
    return [];
  }

  return uniqueEmails((data || []).map((subscriber: any) => subscriber.email));
}

async function getRegisteredUserEmails(): Promise<string[]> {
  ensureSupabase();

  const emails: string[] = [];

  try {
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const users = data?.users || [];
      emails.push(
        ...users
          .filter((user: any) => !user.banned_until)
          .map((user: any) => user.email)
      );

      if (users.length < perPage) break;
      page += 1;
    }
  } catch (error: any) {
    logger.warn(`Unable to load Supabase Auth users for broadcast, falling back to profiles: ${error.message}`);
  }

  if (emails.length === 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('email');

    if (error) {
      logger.warn(`Unable to load profile emails for broadcast: ${error.message}`);
      return [];
    }

    emails.push(...(data || []).map((profile: any) => profile.email));
  }

  return uniqueEmails(emails);
}

async function resolveBroadcastRecipients(group: string, specificRecipients: unknown[] = []): Promise<string[]> {
  const emails: string[] = [];
  const normalizedGroup = (group || 'all').toLowerCase();

  if (normalizedGroup === 'specific' || normalizedGroup === 'custom') {
    return uniqueEmails(specificRecipients);
  }

  if (['users', 'system_users', 'registered_users', 'all', 'both'].includes(normalizedGroup)) {
    emails.push(...await getRegisteredUserEmails());
  }

  if (['subscribers', 'all', 'both'].includes(normalizedGroup)) {
    emails.push(...await getSubscriberEmails());
  }

  return uniqueEmails(emails);
}

async function sendBroadcastEmails(emails: string[], subject: string, message: string) {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP credentials are not configured. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS.');
  }

  const results = [];

  for (const email of emails) {
    try {
      const result = await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: email,
        subject,
        html: message,
        text: String(message).replace(/<[^>]*>/g, '')
      });

      results.push({ email, success: true, messageId: result.messageId });
    } catch (error: any) {
      logger.error(`Broadcast email failed for ${email}: ${error.message}`);
      results.push({ email, success: false, error: error.message });
    }
  }

  return {
    results,
    sentCount: results.filter(result => result.success).length,
    failedCount: results.filter(result => !result.success).length
  };
}

export const adminEmailController = {
  // Get counts for recipient group selection
  getRecipients: async (req: Request, res: Response) => {
    try {
      const [subEmails, userEmails] = await Promise.all([
        getSubscriberEmails(),
        getRegisteredUserEmails()
      ]);
      const bothLists = uniqueEmails([...subEmails, ...userEmails]);

      res.json({
        success: true,
        data: {
          subscriberCount: subEmails.length,
          userCount: userEmails.length,
          bothCount: bothLists.length,
          subscribers: subEmails.map(email => ({ email })),
          users: userEmails.map(email => ({ email }))
        }
      });
    } catch (err: any) {
      logger.error(`Error fetching broadcast recipients: \${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Save a draft or immediately create a broadcast
  createBroadcast: async (req: Request, res: Response) => {
    try {
      ensureSupabase();

      const { name, subject, message, recipient_group, specific_recipients = [], status = 'draft', send_now } = req.body;
      
      const { data, error } = await supabase
        .from('broadcasts')
        .insert([{
          name,
          subject,
          message,
          recipient_group,
          specific_recipients,
          status: send_now ? 'processing' : status
        }])
        .select()
        .single();
        
      if (error) throw error;

      if (send_now) {
        const recipients = await resolveBroadcastRecipients(recipient_group, specific_recipients);

        if (recipients.length === 0) {
          await supabase.from('broadcasts').update({ status: 'sent', sent_count: 0 }).eq('id', data.id);
        } else {
          const result = await sendBroadcastEmails(recipients, data.subject, data.message);
          await supabase
            .from('broadcasts')
            .update({
              status: result.sentCount === 0 ? 'failed' : result.failedCount > 0 ? 'partial' : 'sent',
              sent_count: result.sentCount,
              failed_count: result.failedCount,
              sent_at: new Date().toISOString()
            })
            .eq('id', data.id);
        }
      }

      res.status(201).json({ success: true, message: 'Broadcast initiated successfully', data });
    } catch (err: any) {
      logger.error(`Error creating broadcast: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Send a test email to admin
  sendTestBroadcast: async (req: Request, res: Response) => {
    try {
      ensureSupabase();

      const { id } = req.params;
      const { email } = req.body;
      const testEmail = normalizeEmail(email);

      if (!testEmail) {
        return res.status(400).json({ success: false, error: 'Valid test email address is required' });
      }
      
      const { data: broadcast } = await supabase.from('broadcasts').select('*').eq('id', id).single();
      if (!broadcast) return res.status(404).json({ success: false, error: 'Not found' });
      
      const result = await sendBroadcastEmails([testEmail], `[TEST] ${broadcast.subject}`, broadcast.message);

      if (result.sentCount === 0) {
        return res.status(500).json({ success: false, error: result.results[0]?.error || 'Test email failed' });
      }

      res.json({ success: true, message: 'Test sent successfully' });
    } catch (err: any) {
      logger.error(`Error sending test broadcast: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Queue and send the broadcast
  sendBroadcast: async (req: Request, res: Response) => {
    try {
      ensureSupabase();

      const { id } = req.params;

      const { data: broadcast } = await supabase.from('broadcasts').select('*').eq('id', id).single();
      if (!broadcast) return res.status(404).json({ success: false, error: 'Broadcast not found' });
      if (['processing', 'sent'].includes(broadcast.status)) {
        return res.status(400).json({ success: false, error: 'Already processed' });
      }

      await supabase.from('broadcasts').update({ status: 'processing' }).eq('id', id);

      const recipients = await resolveBroadcastRecipients(
        broadcast.recipient_group,
        broadcast.specific_recipients || []
      );

      let sentCount = 0;
      let failedCount = 0;

      if (recipients.length > 0) {
        const result = await sendBroadcastEmails(recipients, broadcast.subject, broadcast.message);
        sentCount = result.sentCount;
        failedCount = result.failedCount;

        await supabase
          .from('broadcasts')
          .update({
            status: result.sentCount === 0 ? 'failed' : result.failedCount > 0 ? 'partial' : 'sent',
            sent_count: result.sentCount,
            failed_count: result.failedCount,
            sent_at: new Date().toISOString()
          })
          .eq('id', id);
      } else {
        await supabase.from('broadcasts').update({ status: 'sent', sent_count: 0 }).eq('id', id);
      }

      res.json({
        success: sentCount > 0,
        message: recipients.length === 0
          ? 'No valid recipients found'
          : failedCount > 0
            ? 'Broadcast completed with some failures'
            : 'Broadcast sent successfully',
        queuedCount: recipients.length,
        totalRecipients: recipients.length,
        sentCount,
        failedCount
      });
    } catch (err: any) {
      logger.error(`Failed to send broadcast: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getBroadcasts: async (req: Request, res: Response) => {
    try {
      ensureSupabase();

      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ success: true, count: data?.length || 0, data: data || [] });
    } catch (err: any) {
      logger.error(`Error fetching broadcasts: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  sendLegacyBroadcast: async (req: Request, res: Response) => {
    try {
      const { subject, message, targetGroup = 'all', emails = [] } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ success: false, message: 'Subject and message are required' });
      }

      const recipients = targetGroup === 'custom'
        ? uniqueEmails(emails)
        : await resolveBroadcastRecipients(targetGroup, emails);

      if (recipients.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid recipients found' });
      }

      const result = await sendBroadcastEmails(recipients, subject, message);

      res.json({
        success: result.sentCount > 0,
        message: result.failedCount > 0 ? 'Broadcast completed with some failures' : 'Broadcast sent successfully',
        totalRecipients: recipients.length,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        results: result.results
      });
    } catch (err: any) {
      logger.error(`Legacy broadcast failed: ${err.message}`);
      res.status(500).json({ success: false, message: err.message, error: err.message });
    }
  }
};
