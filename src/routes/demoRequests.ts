/**
 * Demo booking API routes
 * ───────────────────────
 * POST /api/demo-requests     — public: book a demo
 * GET  /api/demo-requests     — admin: list requests
 * PATCH /api/demo-requests/:id — admin: update status
 * GET  /api/admin/notifications — admin: list alerts
 * POST /api/admin/notifications/:id/read — mark read
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

function getAdminDb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    '';
  if (!url || !key) throw new Error('Missing Supabase admin env');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function sendAdminEmail(subject: string, text: string) {
  const to =
    process.env.DEMO_NOTIFY_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER ||
    process.env.FROM_EMAIL;
  if (!to) {
    console.warn('[demo] No DEMO_NOTIFY_EMAIL / ADMIN_EMAIL — skip email');
    return;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.FROM_EMAIL || user;
  const fromName = process.env.EMAIL_FROM_NAME || '2K AI Accounting Systems';

  if (!user || !pass) {
    console.warn('[demo] SMTP not configured — skip email');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to,
    subject,
    text,
  });
}

/** POST /api/demo-requests — public */
router.post('/demo-requests', async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      email,
      company,
      phone,
      preferred_date,
      preferred_time,
      message,
      source,
    } = req.body || {};

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ error: 'full_name is required' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const db = getAdminDb();
    const row = {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      preferred_date: preferred_date || null,
      preferred_time: preferred_time || null,
      message: message?.trim() || null,
      source: source || 'web',
      status: 'new',
    };

    const { data, error } = await db
      .from('demo_requests')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('[demo] insert', error);
      return res.status(500).json({ error: error.message });
    }

    const title = `New demo request: ${row.full_name}`;
    const body = [
      `${row.full_name} (${row.email})`,
      row.company ? `Company: ${row.company}` : null,
      row.phone ? `Phone: ${row.phone}` : null,
      row.preferred_date ? `Preferred: ${row.preferred_date} ${row.preferred_time || ''}`.trim() : null,
      row.message ? `Message: ${row.message}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    await db.from('admin_notifications').insert({
      type: 'demo_request',
      title,
      body,
      link: '/admin/demo-requests',
      meta: { demo_request_id: data.id, email: row.email },
    });

    try {
      await sendAdminEmail(
        `[2K AI] ${title}`,
        `${body}\n\nOpen admin panel to follow up.`
      );
    } catch (mailErr: any) {
      console.error('[demo] email failed', mailErr?.message || mailErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Demo request received. We will contact you soon.',
      id: data.id,
    });
  } catch (err: any) {
    console.error('[demo] POST', err);
    return res.status(500).json({ error: 'Could not submit demo request' });
  }
});

/** GET /api/demo-requests — admin list */
router.get(
  '/demo-requests',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string) || undefined;
      const db = getAdminDb();
      let q = db
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/** PATCH /api/demo-requests/:id — admin update status */
router.patch(
  '/demo-requests/:id',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      const allowed = ['new', 'contacted', 'scheduled', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const db = getAdminDb();
      const { data, error } = await db
        .from('demo_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/** GET /api/admin/notifications */
router.get(
  '/admin/notifications',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const unreadOnly = req.query.unread === '1';
      const db = getAdminDb();
      let q = db
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (unreadOnly) q = q.is('read_at', null);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/** POST /api/admin/notifications/:id/read */
router.post(
  '/admin/notifications/:id/read',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = getAdminDb();
      const { error } = await db
        .from('admin_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/** POST /api/admin/notifications/read-all */
router.post(
  '/admin/notifications/read-all',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const db = getAdminDb();
      await db
        .from('admin_notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

export default router;
