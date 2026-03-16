// Backend-compatible Supabase client
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
  console.error('[Supabase Backend] Missing SUPABASE_URL environment variable');
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('[Supabase Backend] Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const isConfigured = !!SUPABASE_URL && !!SUPABASE_SERVICE_KEY;

export const isSupabaseConfigured = isConfigured;

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

export default supabase;
