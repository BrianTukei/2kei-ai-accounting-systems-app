#!/usr/bin/env node

/**
 * Startup Verification Script
 * Run this to check if everything is configured correctly
 * 
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 2K Accounting Systems - Startup Verification\n');
console.log('═'.repeat(50));

let allGood = true;

// Check 1: .env.local exists
console.log('\n1️⃣  Checking .env.local file...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env.local found');
  
  // Read and check variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL=') && !envContent.includes('VITE_SUPABASE_URL=https://your');
  const hasSupabaseKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=') && !envContent.includes('SUPABASE_SERVICE_ROLE_KEY=your');
  
  if (hasSupabaseUrl) {
    console.log('   ✅ VITE_SUPABASE_URL is configured');
  } else {
    console.log('   ❌ VITE_SUPABASE_URL is missing or not set');
    allGood = false;
  }
  
  if (hasSupabaseKey) {
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY is configured');
  } else {
    console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY is missing or not set');
    allGood = false;
  }
} else {
  console.log('   ❌ .env.local NOT FOUND');
  console.log('   → Run: cp .env.example .env.local');
  console.log('   → Then fill in your Supabase credentials');
  allGood = false;
}

// Check 2: Auth files exist
console.log('\n2️⃣  Checking auth files...');
const authFiles = [
  { path: 'src/controllers/authController.ts', name: 'Auth Controller' },
  { path: 'src/routes/auth.ts', name: 'Auth Routes' },
  { path: 'src/middleware/authenticate.ts', name: 'Auth Middleware' },
  { path: 'src/integrations/supabase/serverClient.ts', name: 'Supabase Client' },
];

authFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${file.name}`);
  } else {
    console.log(`   ❌ ${file.name} missing`);
    allGood = false;
  }
});

// Check 3: Dependencies
console.log('\n3️⃣  Checking dependencies...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = packageJson.dependencies || {};
  
  const requiredDeps = [
    { name: '@supabase/supabase-js', display: 'Supabase' },
    { name: 'jsonwebtoken', display: 'JWT' },
    { name: 'express-validator', display: 'Validation' },
  ];
  
  requiredDeps.forEach(dep => {
    if (deps[dep.name]) {
      console.log(`   ✅ ${dep.display}`);
    } else {
      console.log(`   ❌ ${dep.display} not installed`);
      allGood = false;
    }
  });
} else {
  console.log('   ❌ package.json not found');
  allGood = false;
}

// Summary
console.log('\n' + '═'.repeat(50));
if (allGood) {
  console.log('\n✅ All checks passed! Ready to run: npm run dev\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. See above for fixes.\n');
  console.log('Quick fixes:');
  console.log('  1. Create .env.local: cp .env.example .env.local');
  console.log('  2. Add Supabase credentials to .env.local');
  console.log('  3. Install dependencies: npm install');
  console.log('  4. Run: npm run dev\n');
  process.exit(1);
}
