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
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_FROM || SMTP_USER || 'no-reply@2kai.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || '2K AI Accounting Systems';
const MAX_PROVIDER_ATTEMPTS = 3;

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

function isRetryableProviderError(error: any): boolean {
  const status = Number(error?.status || error?.statusCode || 0);
  return status === 429 || status >= 500 || ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN'].includes(error?.code);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function sendBroadcastEmails(
  emails: string[],
  subject: string,
  message: string,
  broadcastId?: string
) {
  if (!RESEND_API_KEY && (!SMTP_USER || !SMTP_PASS)) {
    throw new Error('Email provider is not configured. Set RESEND_API_KEY with a verified FROM_EMAIL, or SMTP_USER/SMTP_PASS.');
  }

  const results = [];

  for (const email of emails) {
    const provider = RESEND_API_KEY ? 'resend' : 'gmail-smtp';
    let attemptCount = 0;
    let completed = false;

    while (attemptCount < MAX_PROVIDER_ATTEMPTS && !completed) {
      attemptCount += 1;
      try {
      const text = String(message).replace(/<[^>]*>/g, '').trim();
      let result: any;

      if (RESEND_API_KEY) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [email],
            subject,
            html: message,
            text
          })
        });

        const payload = await response.json().catch(() => ({}));
        logger.info(`Email provider response for ${email}`, {
          provider,
          status: response.status,
          attempt: attemptCount,
          body: payload
        });
        if (!response.ok) {
          const error: any = new Error(payload?.message || payload?.error || `Resend request failed (${response.status})`);
          error.status = response.status;
          error.providerResponse = payload;
          throw error;
        }

        result = { messageId: payload?.id, accepted: [email], rejected: [], pending: [], providerResponse: payload };
      } else {
        result = await transporter.sendMail({
          from: `"${FROM_NAME}" <${SMTP_USER}>`,
          replyTo: FROM_EMAIL,
          envelope: { from: SMTP_USER, to: email },
          to: email,
          subject,
          html: message,
          text,
          headers: {
            'X-Entity-Ref-ID': `2kai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
          }
        });
        logger.info(`SMTP provider response for ${email}`, {
          provider,
          attempt: attemptCount,
          response: result
        });
        result.providerResponse = {
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
          pending: result.pending,
          envelope: result.envelope
        };
      }

      results.push({
        email,
        success: true,
        provider,
        messageId: result.messageId,
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        pending: result.pending || [],
        attemptCount,
        providerResponse: result.providerResponse || {}
      });
        completed = true;
      } catch (error: any) {
        logger.error(`Broadcast email attempt failed for ${email}`, {
          provider,
          attempt: attemptCount,
          error: error.message,
          providerResponse: error.providerResponse || null
        });
        if (attemptCount < MAX_PROVIDER_ATTEMPTS && isRetryableProviderError(error)) {
          await wait(250 * 2 ** (attemptCount - 1));
          continue;
        }
        results.push({
          email,
          success: false,
          provider,
          attemptCount,
          error: error.message,
          providerResponse: error.providerResponse || {}
        });
        completed = true;
      }
    }
  }

  await recordOutboxResults(results, subject, message, broadcastId);

  return {
    results,
    sentCount: results.filter(result => result.success).length,
    failedCount: results.filter(result => !result.success).length
  };
}

async function recordOutboxResults(results: any[], subject: string, message: string, broadcastId?: string) {
  if (!supabase || results.length === 0) return;

  const rows = results.map(result => ({
    broadcast_id: broadcastId || null,
    recipient_email: result.email,
    subject,
    message,
    status: result.success
      ? result.rejected?.length > 0 && result.accepted?.length === 0 ? 'rejected'
        : result.pending?.length > 0 ? 'pending'
          : result.accepted?.length > 0 ? 'accepted' : 'pending'
      : 'failed',
    provider: result.provider || 'gmail-smtp',
    provider_message_id: result.messageId || null,
    provider_accepted: result.accepted || [],
    provider_rejected: result.rejected || [],
    provider_pending: result.pending || [],
    provider_response: result.providerResponse || {},
    attempt_count: result.attemptCount || 1,
    last_attempt_at: new Date().toISOString(),
    error_message: result.error || null,
    sent_at: result.success ? new Date().toISOString() : null
  }));

  const { error } = await supabase.from('email_outbox').insert(rows);
  if (error) {
    logger.warn(`Unable to record email outbox results: ${error.message}`);
  }
}

function validateEmailPayload(subject: unknown, message: unknown): string | null {
  if (typeof subject !== 'string' || !subject.trim()) return 'Email subject is required';
  if (subject.trim().length > 200) return 'Email subject must be 200 characters or fewer';
  if (typeof message !== 'string' || !message.trim()) return 'Email message is required';
  if (message.length > 200000) return 'Email message is too large';
  return null;
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
          const result = await sendBroadcastEmails(recipients, data.subject, data.message, data.id);
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
      
      const result = await sendBroadcastEmails([testEmail], `[TEST] ${broadcast.subject}`, broadcast.message, id);

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
        const result = await sendBroadcastEmails(recipients, broadcast.subject, broadcast.message, id);
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
            ? 'Broadcast accepted with some failures'
            : 'Broadcast accepted by the email provider; mailbox delivery is not yet confirmed',
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

  getOutbox: async (req: Request, res: Response) => {
    try {
      ensureSupabase();

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
      const status = typeof req.query.status === 'string' ? req.query.status : '';
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('email_outbox')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (['accepted', 'rejected', 'failed', 'pending', 'delivered', 'bounced'].includes(status)) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        pagination: { page, limit, total: count || 0 }
      });
    } catch (err: any) {
      logger.error(`Error fetching email outbox: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Provider webhook: turns provider acceptance into observable delivery state.
  providerWebhook: async (req: Request, res: Response) => {
    try {
      ensureSupabase();
      if (!RESEND_WEBHOOK_SECRET || req.header('x-webhook-secret') !== RESEND_WEBHOOK_SECRET) {
        return res.status(401).json({ success: false, error: 'Invalid webhook secret' });
      }

      const event = req.body || {};
      const eventType = String(event.type || '').toLowerCase();
      const statusByEvent: Record<string, string> = {
        'email.delivered': 'delivered',
        'email.bounced': 'bounced',
        'email.complained': 'complained',
        'email.failed': 'failed'
      };
      const status = statusByEvent[eventType];
      const providerMessageId = event.data?.email_id || event.data?.id;

      if (!status || !providerMessageId) {
        return res.status(400).json({ success: false, error: 'Unsupported event or missing provider message ID' });
      }

      const update: Record<string, unknown> = {
        status,
        provider_response: event.data || event,
        delivered_at: status === 'delivered' ? new Date().toISOString() : undefined,
        bounced_at: status === 'bounced' ? new Date().toISOString() : undefined,
      };
      Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);

      const { error } = await supabase
        .from('email_outbox')
        .update(update)
        .eq('provider_message_id', providerMessageId);
      if (error) throw error;

      const { data: outboxEntry } = await supabase
        .from('email_outbox')
        .select('broadcast_id')
        .eq('provider_message_id', providerMessageId)
        .maybeSingle();
      if (outboxEntry?.broadcast_id) {
        const [{ count: deliveredCount }, { count: bounceCount }] = await Promise.all([
          supabase.from('email_outbox').select('*', { count: 'exact', head: true })
            .eq('broadcast_id', outboxEntry.broadcast_id).eq('status', 'delivered'),
          supabase.from('email_outbox').select('*', { count: 'exact', head: true })
            .eq('broadcast_id', outboxEntry.broadcast_id).in('status', ['bounced', 'complained'])
        ]);
        await supabase.from('broadcasts').update({
          delivered_count: deliveredCount || 0,
          bounce_count: bounceCount || 0
        }).eq('id', outboxEntry.broadcast_id);
      }

      logger.info(`Email delivery webhook recorded: ${eventType}`, { providerMessageId, status });
      return res.json({ success: true, status });
    } catch (err: any) {
      logger.error(`Email delivery webhook failed: ${err.message}`);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  sendLegacyBroadcast: async (req: Request, res: Response) => {
    try {
      const { subject, message, targetGroup = 'all', emails = [] } = req.body;

      const validationError = validateEmailPayload(subject, message);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError, error: validationError });
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
        message: result.failedCount > 0 ? 'Broadcast accepted with some failures' : 'Broadcast accepted by the email provider; mailbox delivery is not yet confirmed',
        totalRecipients: recipients.length,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        results: result.results
      });
    } catch (err: any) {
      logger.error(`Legacy broadcast failed: ${err.message}`);
      res.status(500).json({ success: false, message: err.message, error: err.message });
    }
  },

  // Backward-compatible direct send endpoint used by the legacy admin screens
  sendEmail: async (req: Request, res: Response) => {
    try {
      const { subject, message, emails = [], userId } = req.body;
      const validationError = validateEmailPayload(subject, message);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }

      let recipients = uniqueEmails(Array.isArray(emails) ? emails : []);
      if (recipients.length === 0 && userId) {
        recipients = await getRegisteredUserEmails();
      }
      if (recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one valid recipient email is required' });
      }

      const result = await sendBroadcastEmails(recipients, subject.trim(), message);
      res.status(result.sentCount > 0 ? 200 : 502).json({
        success: result.sentCount > 0,
        message: result.failedCount > 0 ? 'Email accepted with some failures' : 'Email accepted by the email provider; mailbox delivery is not yet confirmed',
        data: {
          ...result,
          summary: {
            total: recipients.length,
            sent: result.sentCount,
            failed: result.failedCount
          }
        },
        ...result
      });
    } catch (err: any) {
      logger.error(`Direct admin email failed: ${err.message}`);
      res.status(500).json({ success: false, error: err.message, message: err.message });
    }
  },

  // Verify SMTP credentials without sending an email
  verifyTransport: async (_req: Request, res: Response) => {
    try {
      if (RESEND_API_KEY) {
        return res.json({ success: true, configured: true, provider: 'resend', message: 'Resend email transport is configured' });
      }

      if (!SMTP_USER || !SMTP_PASS) {
        return res.status(503).json({
          success: false,
          configured: false,
          error: 'Email provider is not configured. Set RESEND_API_KEY with a verified FROM_EMAIL, or SMTP_USER/SMTP_PASS.'
        });
      }

      await transporter.verify();
      res.json({ success: true, configured: true, message: 'Email transport is ready' });
    } catch (err: any) {
      logger.error(`Email transport verification failed: ${err.message}`);
      res.status(502).json({ success: false, configured: true, error: err.message });
    }
  }
};
