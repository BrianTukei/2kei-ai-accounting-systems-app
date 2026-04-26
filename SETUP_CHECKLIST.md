# ✅ Setup Checklist

Complete these steps in order:

## Phase 1: Supabase Setup
- [ ] Created account at [app.supabase.com](https://app.supabase.com)
- [ ] Created a new project
- [ ] Project is initialized and ready
- [ ] Went to **Settings → API**
- [ ] Copied **Project URL** (https://xxx.supabase.co)
- [ ] Copied **Anon Public Key** (eyJhbGc...)
- [ ] Copied **Service Role Secret** (eyJhbGc...)

## Phase 2: Create .env.local File
- [ ] Created file called `.env.local` in project root
- [ ] Added these 8 variables:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_PUBLISHABLE_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  PORT=3001
  NODE_ENV=development
  JWT_SECRET=any-random-string
  VITE_API_URL=http://localhost:3001/api
  ```
- [ ] All values are filled in (no empty variables)
- [ ] File is in correct location: `/path/to/2K AI Accounting Systems/.env.local`

## Phase 3: Supabase Database Setup
- [ ] Opened Supabase Dashboard
- [ ] Went to **SQL Editor**
- [ ] Ran the SQL code from [SUPABASE_QUICKSTART.md](SUPABASE_QUICKSTART.md#step-4-create-users-table-in-supabase)
- [ ] Users table was created successfully

## Phase 4: Start Application
- [ ] Opened terminal/command line
- [ ] Navigated to project root
- [ ] Ran: `npm install` (to ensure all dependencies installed)
- [ ] Ran: `npm run dev`
- [ ] Terminal shows:
  - Backend running on port 3001
  - Frontend running on port 8080
  - "[Supabase] Client initialized successfully"

## Phase 5: Test Login
- [ ] Opened browser to [http://localhost:8080](http://localhost:8080)
- [ ] Clicked "Register" or "Sign Up"
- [ ] Filled in form (name, email, password)
- [ ] Submitted form
- [ ] Either:
  - ✅ Got logged in and redirected to dashboard, OR
  - ❌ Got an error message

## If you got an error:
- [ ] Opened browser console with F12
- [ ] Took a screenshot of the error
- [ ] Noted what it says

**Next: Share the error message and I'll help you fix it!** 🚀

---

## File Locations (for reference)

```
2K AI Accounting Systems/
├── .env.local                          ← You need to CREATE this
├── .env.example                        ← Reference only (don't use)
├── SUPABASE_QUICKSTART.md              ← Setup instructions
├── TROUBLESHOOTING.md                  ← For errors
├── src/
│   ├── controllers/
│   │   └── authController.ts           ← Login/Register logic
│   ├── routes/
│   │   └── auth.ts                     ← Auth endpoints
│   ├── middleware/
│   │   └── authenticate.ts             ← Token verification
│   └── integrations/
│       └── supabase/
│           └── serverClient.ts         ← Supabase connection
└── package.json                        ← Dependencies
```

---

## Commands Quick Reference

```bash
# Check if .env.local exists
ls .env.local        # Mac/Linux
dir .env.local       # Windows PowerShell

# Start dev server
npm run dev

# Check Node version
node --version

# Reinstall dependencies
rm -rf node_modules && npm install  # Mac/Linux
rmdir /s node_modules && npm install # Windows
```
