# 🚀 Get Login Working in 5 Minutes

## The Problem
You're getting: **"Service temporarily unavailable. Please try again later or contact support."**

**Reason:** Your Supabase credentials aren't configured in `.env.local`

## The Fix (Do This Now)

### Step 1: Get Supabase Credentials (2 min)
1. Go to **https://app.supabase.com**
2. Log in or create account
3. Click your project (or create new one)
4. Go to **Settings** → **API** (left sidebar)
5. Copy these 3 values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **Anon public key** (starts with: `eyJhbGc...`)
   - **Service role secret** (also starts with: `eyJhbGc...`)

### Step 2: Create `.env.local` File (2 min)
Create a new file in your project root called `.env.local` with:

```env
VITE_SUPABASE_URL=https://your-project-xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-key...
PORT=3001
NODE_ENV=development
JWT_SECRET=any-random-string-here
VITE_API_URL=http://localhost:3001/api
```

**⚠️ Important:** Replace the values with YOUR actual keys

### Step 3: Create Users Table in Supabase (1 min)
1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Copy-paste this SQL:

```sql
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE USING (auth.uid() = id);

CREATE INDEX idx_users_email ON users(email);
```

3. Click **Run** button

### Step 4: Restart Server (1 min)
```bash
# Stop server if running (Ctrl+C)

# Reinstall everything (just in case)
npm install

# Start server
npm run dev
```

Watch the terminal for:
```
✅ [Supabase] Client initialized successfully
🚀 2K AI Accounting Systems Backend running on port 3001
```

### Step 5: Test Login
1. Open **http://localhost:8080**
2. Click "Register" 
3. Create an account
4. You should get logged in! ✅

---

## Still Getting Error?

**Check this:**
```bash
# Run the verification script
node verify-setup.js
```

It will tell you exactly what's missing.

---

## Common Issues

| Issue | Fix |
|-------|-----|
| "Service temporarily unavailable" | Run `node verify-setup.js` to see what's missing |
| `.env.local` not found | Create it with: `cp .env.example .env.local` |
| Port 3001 already in use | Change PORT in `.env.local` to 3002 |
| "Users table not found" | Run the SQL code from Step 3 above |
| Backend not connecting | Make sure backend is running (`npm run dev`) |

---

## File Structure
```
2K AI Accounting Systems/
├── .env.local                          ← YOU NEED TO CREATE THIS
├── src/
│   ├── controllers/authController.ts   ← Login logic (✅ ready)
│   ├── routes/auth.ts                  ← Auth endpoints (✅ ready)
│   └── integrations/supabase/          ← Supabase config (✅ ready)
└── package.json
```

---

## Need Help?
1. Check terminal output for errors
2. Run: `node verify-setup.js`
3. Read detailed guides:
   - `SUPABASE_QUICKSTART.md`
   - `TROUBLESHOOTING.md`
   - `SETUP_CHECKLIST.md`

**You've got this!** 💪
