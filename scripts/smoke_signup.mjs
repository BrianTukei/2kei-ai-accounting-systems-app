import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
// load .env manually because dotenv isn't installed as an ES module in this environment
const envPath = new URL('../.env', import.meta.url);
let env = {};
try {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/);
    if (m) env[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  });
} catch (e) {
  // ignore
}

const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in env');
  process.exit(1);
}
const supabase = createClient(url, key);
const email = `test+${Date.now()}@mailinator.com`;
import crypto from 'crypto';
const password = 'P' + crypto.randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g, 'A');
console.log('Attempting signUp for', email);
try {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('signUp error:', error.message || error);
    process.exit(2);
  }
  console.log('signUp returned:', JSON.stringify(data, null, 2));
} catch (err) {
  console.error('Unexpected error', err);
  process.exit(3);
}
