import { Request, Response, NextFunction } from 'express';
import { createClient, User, SupabaseClient } from '@supabase/supabase-js';

// Extend Express Request so TypeScript knows about req.user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
    }
  }
}

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    '';

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for auth middleware'
    );
  }

  supabaseAdmin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

/**
 * Require a valid Supabase JWT in Authorization: Bearer <token>
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing access token' });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (err: any) {
    console.error('[requireAuth]', err?.message || err);
    return res.status(500).json({ error: 'Auth check failed' });
  }
}

/**
 * Require authenticated user + admin role.
 * Looks up user_roles table: role = 'admin' for this user_id.
 * Falls back to matching ADMIN_USER_IDS env (comma-separated UUIDs) if table missing.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = getSupabaseAdmin();
    const userId = req.user.id;

    // Optional hard-coded allow list (set on Render)
    const allowList = (process.env.ADMIN_USER_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (allowList.includes(userId)) {
      return next();
    }

    // Primary: user_roles table
    const { data, error } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      // Table might not exist yet — fail closed unless allow list matched above
      console.error('[requireAdmin] user_roles lookup:', error.message);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin role required',
      });
    }

    if (!data) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin role required',
      });
    }

    next();
  } catch (err: any) {
    console.error('[requireAdmin]', err?.message || err);
    return res.status(500).json({ error: 'Admin check failed' });
  }
}

/**
 * Optional auth: attaches user if token present, continues otherwise.
 * Useful for endpoints that work better when logged in but aren't private.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return next();

    const admin = getSupabaseAdmin();
    const { data } = await admin.auth.getUser(token);
    if (data?.user) {
      req.user = data.user;
      req.accessToken = token;
    }
    next();
  } catch {
    next();
  }
}
