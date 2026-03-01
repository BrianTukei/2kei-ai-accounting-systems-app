/**
 * One-time script to grant admin role to the platform owner.
 * Run: node scripts/setup_admin.mjs
 *
 * This script:
 *  1. Signs in with your email/password
 *  2. Retrieves your user ID
 *  3. Inserts 'admin' role into user_roles (via service role or direct SQL)
 */

const SUPABASE_URL = 'https://xyxjaqdpbbkjboavbivp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eGphcWRwYmJramJvYXZiaXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzgwODYsImV4cCI6MjA4Nzc1NDA4Nn0.yixteZUrxQv6J-FjH1dYUJ4vmMH4aT3e3v8ynisB7Ys';

const ADMIN_EMAIL = 'briantukei1000@gmail.com';
const ADMIN_PASSWORD = 'Tukei@1000$';

async function main() {
  console.log('=== Admin Role Setup ===\n');

  // Step 1: Sign in
  console.log('1. Signing in as', ADMIN_EMAIL, '...');
  const signInResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!signInResp.ok) {
    const err = await signInResp.json();
    console.error('❌ Sign-in failed:', err.error_description || err.msg || JSON.stringify(err));
    console.log('\nMake sure the account exists and the password is correct.');
    console.log('If you haven\'t signed up yet, do so at your app first, then re-run this script.');
    process.exit(1);
  }

  const session = await signInResp.json();
  const userId = session.user.id;
  const accessToken = session.access_token;

  console.log('✅ Signed in successfully!');
  console.log('   User ID:', userId);
  console.log('   Email:  ', session.user.email);
  console.log('');

  // Step 2: Try inserting admin role via RLS (may fail for first admin)
  console.log('2. Granting admin role...');

  // Try direct insert via PostgREST (using session token)
  const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      role: 'admin',
    }),
  });

  if (insertResp.ok) {
    const data = await insertResp.json();
    console.log('✅ Admin role granted successfully!');
    console.log('   Role ID:', data[0]?.id);
    console.log('\n🎉 You can now access the Admin Dashboard at /admin');
    console.log('   Refresh your browser and look for the red "Admin" section in the hamburger menu.');
    return;
  }

  // If RLS blocks it, check if already admin
  const checkResp = await fetch(
    `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    },
  );

  if (checkResp.ok) {
    const existing = await checkResp.json();
    if (existing.length > 0) {
      console.log('✅ You already have admin role!');
      console.log('\n🎉 Admin Dashboard should be visible at /admin');
      console.log('   Refresh your browser and look for the red "Admin" section in the hamburger menu.');
      return;
    }
  }

  // If insert was blocked by RLS, provide SQL to run manually
  const insertErr = await insertResp.text();
  console.log('⚠️  Direct insert blocked by RLS (expected for first admin).');
  console.log('   Error:', insertErr);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  MANUAL STEP REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Go to your Supabase Dashboard:');
  console.log(`  https://supabase.com/dashboard/project/xyxjaqdpbbkjboavbivp/sql/new`);
  console.log('');
  console.log('Paste and run this SQL:');
  console.log('');
  console.log(`  INSERT INTO public.user_roles (user_id, role)`);
  console.log(`  VALUES ('${userId}', 'admin')`);
  console.log(`  ON CONFLICT (user_id, role) DO NOTHING;`);
  console.log('');
  console.log('After running the SQL, refresh your app — the Admin Dashboard will appear!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
