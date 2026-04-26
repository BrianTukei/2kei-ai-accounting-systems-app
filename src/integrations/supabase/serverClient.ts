import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client for Backend
 * Used for all database operations
 * 
 * Environment variables needed in .env.local:
 * - VITE_SUPABASE_URL (or SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
 */

// Try multiple env var names for compatibility
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);

// Log startup configuration (helps with debugging)
console.log('[Supabase] Initialization...');
if (SUPABASE_URL) {
  console.log('[Supabase] ✅ URL configured:', SUPABASE_URL.substring(0, 30) + '...');
} else {
  console.error('[Supabase] ❌ Missing VITE_SUPABASE_URL');
}

if (SUPABASE_SERVICE_KEY) {
  console.log('[Supabase] ✅ Service key configured');
} else {
  console.error('[Supabase] ❌ Missing SUPABASE_SERVICE_ROLE_KEY');
}

if (!isSupabaseConfigured) {
  console.error('');
  console.error('⚠️  CRITICAL: Supabase not properly configured!');
  console.error('');
  console.error('Fix this by creating .env.local in project root with:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key');
  console.error('');
}

// Create Supabase client with service role for backend operations
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Test connection on startup only if configured
if (isSupabaseConfigured) {
  supabase.auth.getSession()
    .then(() => {
      console.log('✅ [Supabase] Client initialized successfully');
    })
    .catch((err) => {
      console.error('⚠️  [Supabase] Client initialization warning:', err.message);
    });
}

export default supabase;
