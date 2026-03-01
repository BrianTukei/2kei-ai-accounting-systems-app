const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

(async () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in env');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const email = `test+${Date.now()}@mailinator.com`;
  const password = 'Passw0rd!';
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
})();
