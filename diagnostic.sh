#!/bin/bash

echo "🔍 2K Accounting Systems - Diagnostic Check"
echo "=============================================="
echo ""

# Check if .env.local exists
echo "1️⃣ Environment Variables:"
if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
  echo "   - VITE_SUPABASE_URL: $(grep VITE_SUPABASE_URL .env.local | cut -d'=' -f2 | head -c 30)..."
  echo "   - VITE_SUPABASE_PUBLISHABLE_KEY: $(grep VITE_SUPABASE_PUBLISHABLE_KEY .env.local | cut -d'=' -f2 | head -c 20)..."
  echo "   - SUPABASE_SERVICE_ROLE_KEY: $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2 | head -c 20)..."
else
  echo "❌ .env.local NOT FOUND"
  echo "   → Create .env.local with Supabase credentials"
fi

echo ""
echo "2️⃣ Checking auth files:"
[ -f "src/controllers/authController.ts" ] && echo "✅ authController.ts exists" || echo "❌ authController.ts missing"
[ -f "src/routes/auth.ts" ] && echo "✅ auth.ts route exists" || echo "❌ auth.ts route missing"
[ -f "src/middleware/authenticate.ts" ] && echo "✅ authenticate.ts middleware exists" || echo "❌ authenticate.ts middleware missing"
[ -f "src/integrations/supabase/serverClient.ts" ] && echo "✅ serverClient.ts exists" || echo "❌ serverClient.ts missing"

echo ""
echo "3️⃣ Dependencies check:"
if grep -q "\"supabase\"" package.json; then
  echo "✅ @supabase/supabase-js installed"
else
  echo "❌ @supabase/supabase-js NOT installed"
  echo "   → Run: npm install @supabase/supabase-js"
fi

if grep -q "\"jsonwebtoken\"" package.json; then
  echo "✅ jsonwebtoken installed"
else
  echo "❌ jsonwebtoken NOT installed"
fi

if grep -q "\"express-validator\"" package.json; then
  echo "✅ express-validator installed"
else
  echo "❌ express-validator NOT installed"
fi

echo ""
echo "4️⃣ Next steps:"
echo "   a) Create .env.local with Supabase credentials"
echo "   b) Run 'npm run dev' to start the server"
echo "   c) Check browser console (F12) for errors"
echo "   d) Check terminal for backend errors"
echo ""
echo "📋 For detailed setup, see: SUPABASE_QUICKSTART.md"
