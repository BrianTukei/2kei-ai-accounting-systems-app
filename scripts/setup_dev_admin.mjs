/**
 * Setup Developer Admin - One-time script to grant developer admin access
 * Run: node scripts/setup_dev_admin.mjs
 *
 * This script:
 *  1. Signs in with your email/password
 *  2. Retrieves your user ID
 *  3. Inserts into admin_users table (for Developer Admin Dashboard)
 *  4. Also ensures user_roles has admin entry
 */

const SUPABASE_URL = 'https://xyxjaqdpbbkjboavbivp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eGphcWRwYmJramJvYXZiaXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzgwODYsImV4cCI6MjA4Nzc1NDA4Nn0.yixteZUrxQv6J-FjH1dYUJ4vmMH4aT3e3v8ynisB7Ys';

// Update these values to match your account
const ADMIN_EMAIL = 'briantukei1000@gmail.com';
const ADMIN_PASSWORD = 'Tukei@1000$';

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   2KEI AI Accounting - Developer Admin Setup     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

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
    process.exit(1);
  }

  const session = await signInResp.json();
  const userId = session.user.id;
  const accessToken = session.access_token;

  console.log('✅ Signed in successfully!');
  console.log('   User ID:', userId);
  console.log('   Email:  ', session.user.email);
  console.log('');

  // Step 2: Check/Insert admin_users entry
  console.log('2. Setting up Developer Admin role...');

  // Check if already exists in admin_users
  const checkAdminResp = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${userId}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    },
  );

  let adminUserExists = false;
  if (checkAdminResp.ok) {
    const existingAdmin = await checkAdminResp.json();
    if (existingAdmin.length > 0) {
      console.log('✅ Admin user entry already exists in admin_users!');
      console.log('   Role:', existingAdmin[0].admin_role);
      adminUserExists = true;
    }
  }

  if (!adminUserExists) {
    // Try to insert into admin_users
    const insertAdminResp = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        admin_role: 'super_admin',
        department: 'Platform',
        permissions: ['*'],
        is_active: true,
      }),
    });

    if (insertAdminResp.ok) {
      const data = await insertAdminResp.json();
      console.log('✅ Developer Admin role created!');
      console.log('   Role: super_admin');
    } else {
      const errText = await insertAdminResp.text();
      console.log('⚠️  Could not insert into admin_users via API.');
      console.log('   (This is expected if RLS blocks first admin creation)');
    }
  }

  // Step 3: Also ensure user_roles has admin entry
  console.log('\n3. Ensuring basic admin role in user_roles...');

  const checkRoleResp = await fetch(
    `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    },
  );

  let roleExists = false;
  if (checkRoleResp.ok) {
    const existingRole = await checkRoleResp.json();
    if (existingRole.length > 0) {
      console.log('✅ Admin role already exists in user_roles!');
      roleExists = true;
    }
  }

  if (!roleExists) {
    const insertRoleResp = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
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

    if (insertRoleResp.ok) {
      console.log('✅ Admin role added to user_roles!');
    }
  }

  // Final instructions
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  MANUAL SQL (if automatic setup was blocked by RLS)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Go to Supabase SQL Editor:');
  console.log('  https://supabase.com/dashboard/project/xyxjaqdpbbkjboavbivp/sql/new');
  console.log('');
  console.log('Run this SQL:');
  console.log('');
  console.log('─────────────────────────────────────────────────────');
  console.log(`-- Grant admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId}', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant developer admin access (super_admin role)
INSERT INTO public.admin_users (user_id, admin_role, department, permissions, is_active)
VALUES (
  '${userId}',
  'super_admin',
  'Platform',
  ARRAY['*'],
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  admin_role = 'super_admin',
  is_active = true;`);
  console.log('─────────────────────────────────────────────────────');
  console.log('');
  console.log('After running the SQL:');
  console.log('  • Clear browser cache / hard refresh');
  console.log('  • Navigate to /dev-admin');
  console.log('');
  console.log('🎉 Done! Developer Admin Dashboard should now be accessible.');
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
