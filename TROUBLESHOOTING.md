# Troubleshooting Guide

## Quick Diagnosis

To help you fix the error, please provide:

1. **The exact error message** (copy & paste it)
2. **Where you see it:**
   - [ ] Browser page display
   - [ ] Browser console (press F12)
   - [ ] Terminal/command line
3. **What did you do:**
   - [ ] Created `.env.local` file?
   - [ ] Added Supabase credentials to `.env.local`?
   - [ ] Created users table in Supabase?
   - [ ] Ran `npm run dev`?

## Common Issues & Fixes

### ❌ Error: "Service temporarily unavailable"

**Cause 1: Missing .env.local**
```bash
# Check if .env.local exists
ls -la .env.local    # Mac/Linux
dir .env.local       # Windows
```
**Fix:** Create `.env.local` with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=development
JWT_SECRET=any-random-string-here
VITE_API_URL=http://localhost:3001/api
```

**Cause 2: Wrong Supabase credentials**
- Double-check that you copied the values correctly (with no extra spaces)
- Make sure you're using the **anon key** for `VITE_SUPABASE_PUBLISHABLE_KEY`, not the service role

**Cause 3: Users table not created**
- Go to Supabase Dashboard → SQL Editor
- Run the SQL from SUPABASE_QUICKSTART.md

---

### ❌ Error: "Cannot find module '@supabase/supabase-js'"

**Fix:** Install dependencies:
```bash
npm install
```

---

### ❌ Error: "VITE_SUPABASE_URL is required"

**Cause:** Environment variables not loaded
**Fix:** 
1. Make sure `.env.local` is in the root directory (same level as `package.json`)
2. Restart the dev server: Stop it with Ctrl+C, then run `npm run dev` again

---

### ❌ Error in browser console: "Auth.users table not found" or database errors

**Cause:** Users table not created in Supabase
**Fix:** Run this SQL in Supabase SQL Editor:

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

---

### ❌ Error: "Invalid or expired token"

**Cause:** JWT_SECRET not set or different on frontend/backend
**Fix:** Make sure both use the same JWT_SECRET in `.env.local`

---

### ❌ Login works but stays on login page

**Cause:** Token not being stored or redirect not working
**Check:**
1. Browser console - any errors? (F12)
2. Network tab - POST /api/auth/login returns success?
3. Local Storage - does token get saved?

---

## Step-by-Step Verification

Run these commands to verify your setup:

```bash
# 1. Check Node.js version (needs v16+)
node --version

# 2. Check npm is installed
npm --version

# 3. Check .env.local exists
cat .env.local

# 4. Check dependencies are installed
npm list @supabase/supabase-js
npm list express-validator
npm list jsonwebtoken

# 5. Start dev server with verbose output
npm run dev

# 6. In another terminal, test the API
curl http://localhost:3001/health
```

Expected outputs:
```
✅ node version: v18+
✅ npm: 8+
✅ .env.local has: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
✅ dependencies installed
✅ dev server logs show "[Supabase] Client initialized successfully"
✅ curl returns: {"status":"ok","..."}
```

---

## Still Stuck?

Share these details:

```
1. Node version: [run: node --version]
2. Error message: [copy from console or terminal]
3. .env.local setup: [have you created it? Y/N]
4. Supabase project: [created and initialized? Y/N]
5. Users table: [created in Supabase? Y/N]
6. Terminal output: [paste the full output from npm run dev]
```

Then I can help you fix it! 🚀
