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

// Basic Email Transporter (Queued later)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const adminEmailController = {
  // Get counts for recipient group selection
  getRecipients: async (req: Request, res: Response) => {
    try {
      // 1. Target Subscribers
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('email')
        .eq('status', 'active');
        
      // 2. System Users
      const { data: users } = await supabase
        .from('users')
        .select('email')
        .eq('status', 'active');

      const subEmails = (subscribers || []).map(s => s.email);
      const userEmails = (users || []).map(u => u.email);
      const bothLists = [...new Set([...subEmails, ...userEmails])];

      res.json({
        success: true,
        data: {
          subscriberCount: subEmails.length,
          userCount: userEmails.length,
          bothCount: bothLists.length,
          subscribers: subscribers || [], // Send all subscribers
          users: users || [] 
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
      const { name, subject, message, recipient_group, status = 'draft', send_now } = req.body;
      
      const { data, error } = await supabase
        .from('broadcasts')
        .insert([{
          name, subject, message, recipient_group, status: send_now ? 'processing' : status
        }])
        .select()
        .single();
        
      if (error) throw error;

      if (send_now) {
        // Collect target emails
        const emails: string[] = [];
        const group = recipient_group;
        
        if (group === 'subscribers' || group === 'all' || group === 'both') {
          const { data: subs } = await supabase.from('subscribers').select('email').eq('status', 'active');
          if (subs) emails.push(...subs.map(s => s.email));
        }
        if (group === 'users' || group === 'system_users' || group === 'both') {
          const { data: users } = await supabase.from('users').select('email').eq('status', 'active');
          if (users) emails.push(...users.map(u => u.email));
        }
  
        const uniqueEmails = [...new Set(emails)].filter(e => e && e.includes('@'));
        
        if (uniqueEmails.length > 0) {
          await supabase.from('processing_jobs').insert([{
             type: 'email_broadcast',
             status: 'pending',
             payload: {
               broadcastId: data.id,
               subject: data.subject,
               message: data.message,
               emails: uniqueEmails
             }
          }]);
        } else {
          await supabase.from('broadcasts').update({ status: 'sent', sent_count: 0 }).eq('id', data.id);
        }
      }

      res.status(201).json({ success: true, message: 'Broadcast initiated successfully', data });
    } catch (err: any) {
      logger.error(`Error creating broadcast: \${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Send a test email to admin
  sendTestBroadcast: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      
      const { data: broadcast } = await supabase.from('broadcasts').select('*').eq('id', id).single();
      if (!broadcast) return res.status(404).json({ success: false, error: 'Not found' });
      
      await transporter.sendMail({
        from: `"2K AI Accounting Systems" <${process.env.FROM_EMAIL || 'no-reply@2kai.com'}>`,
        to: email,
        subject: `[TEST] \${broadcast.subject}`,
        html: broadcast.message
      });

      res.json({ success: true, message: 'Test sent successfully' });
    } catch (err: any) {
      logger.error(`Error sending test broadcast: \${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Queue and send the broadcast
  sendBroadcast: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data: broadcast } = await supabase.from('broadcasts').select('*').eq('id', id).single();
      if (!broadcast) return res.status(404).json({ success: false, error: 'Broadcast not found' });
      if (['processing', 'sent'].includes(broadcast.status)) {
        return res.status(400).json({ success: false, error: 'Already processed' });
      }

      await supabase.from('broadcasts').update({ status: 'processing' }).eq('id', id);

      // Collect target emails
      const emails: string[] = [];
      const group = broadcast.recipient_group;
      
      if (group === 'subscribers' || group === 'all' || group === 'both') {
        const { data: subs } = await supabase.from('subscribers').select('email').eq('status', 'active');
        if (subs) emails.push(...subs.map(s => s.email));
      }
      if (group === 'users' || group === 'system_users' || group === 'both') {
        const { data: users } = await supabase.from('users').select('email').eq('status', 'active');
        if (users) emails.push(...users.map(u => u.email));
      }

      const uniqueEmails = [...new Set(emails)].filter(e => e && e.includes('@'));

      // Queue system implementation: Create a processing job for the worker natively
      if (uniqueEmails.length > 0) {
        await supabase.from('processing_jobs').insert([{
           type: 'email_broadcast',
           status: 'pending',
           payload: {
             broadcastId: id,
             subject: broadcast.subject,
             message: broadcast.message,
             emails: uniqueEmails
           }
        }]);
      } else {
        await supabase.from('broadcasts').update({ status: 'sent', sent_count: 0 }).eq('id', id);
      }

      res.json({ success: true, message: 'Broadcast queued successfully', queuedCount: uniqueEmails.length });
    } catch (err: any) {
      logger.error(`Failed to send broadcast: \${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};