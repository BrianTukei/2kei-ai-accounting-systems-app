# Supabase Setup Guide

## Quick Start (5 minutes)

### Step 1: Create Supabase Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and wait for it to initialize

### Step 2: Get Your Credentials
1. Go to **Project Settings** → **API**
2. Copy these three values:
   - **Project URL** (under "URL")
   - **Anon Public Key** (under "Project API keys" → "anon public")
   - **Service Role Secret** (under "Project API keys" → "service_role" - keep this SECRET!)

### Step 3: Create .env.local File
Create a `.env.local` file in your project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...

# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-key-here
VITE_API_URL=http://localhost:3001/api
```

### Step 4: Create Users Table in Supabase
Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to read their own data
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Create RLS policy for users to update their own data
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Create index for faster queries
CREATE INDEX idx_users_email ON users(email);
```

### Step 5: Run the Application
```bash
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3001
- **API**: http://localhost:3001/api

## Testing Login
1. Create a user account on the registration page
2. Or if you have a Supabase user, use their credentials

## Troubleshooting

### "Service temporarily unavailable" error
**Cause**: Missing or incorrect Supabase credentials
**Fix**: 
1. Check your `.env.local` file has all three Supabase variables
2. Verify the keys are correct (copy-paste exactly)
3. Restart the dev server: `npm run dev`

### "Auth.users" table not found
**Cause**: Supabase Auth isn't enabled
**Fix**: This is automatic when you create a Supabase project - no action needed

### Can't login after registration
**Cause**: Users table RLS policies not set up
**Fix**: Run the SQL code from Step 4 above in your Supabase SQL Editor

## MongoDB Removal ✅
MongoDB has been completely removed. All authentication now uses **Supabase Auth** and the `users` table.

## Next Steps
- Set up other database tables as needed (transactions, companies, etc.)
- Configure payment processors (Stripe, Paystack, etc.)
- Set up email templates in Supabase
- Deploy to production (Vercel for frontend, Supabase for backend)

## Support
- [Supabase Docs](https://supabase.com/docs)
- [Authentication Guide](https://supabase.com/docs/guides/auth)
- [REST API Reference](https://supabase.com/docs/guides/api)
