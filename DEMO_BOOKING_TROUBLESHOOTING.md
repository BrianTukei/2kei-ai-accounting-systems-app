# Demo Booking Error Troubleshooting Guide

## Quick Diagnosis Steps

### Step 1: Check the Network Response (REQUIRED)

1. **Open Browser DevTools**: Press `F12`
2. **Go to Network Tab**
3. **Submit the demo booking form**
4. **Find the request**: Look for `POST /api/demo/book`
5. **Check Status Code**:

| Status | Meaning | Fix |
|--------|---------|-----|
| **400** | Validation failed or missing company | See below |
| **409** | Email already has pending/confirmed booking | Use different email |
| **500** | Server error / database error | Check MongoDB connection |
| **Network Error** | Cannot reach backend | Is server running on correct port? |

6. **Click the request** → **Response tab** → **Copy the error JSON**

### Step 2: Validate Form Data

Check if these fields are present and valid:

```javascript
{
  "name": "John Doe",              // ✅ Required: 2-100 chars
  "email": "john@example.com",     // ✅ Required: Valid email
  "company": "Acme Corp",          // ✅ Required: 2-200 chars
  "phone": "+1234567890",          // ✅ Required
  "preferredDate": "2026-04-25",   // ✅ Required: Future date in YYYY-MM-DD
  "preferredTime": "14:00",        // ✅ Required: HH:MM format (24-hour)
  "timezone": "UTC",               // ✅ Required: One of UTC, EST, CST, MST, PST, GMT, CET, IST, JST, AEST
  "website": "https://example.com" // ❌ Optional
  "message": "Looking forward..."  // ❌ Optional
}
```

**Action**: Open DevTools Console and run:
```javascript
// In the browser console:
console.log(document.querySelector('form').elements);
// Or check what data is being sent by adding to BookDemo.tsx:
console.log('Sending booking data:', bookingData);
```

### Step 3: Check MongoDB Connection

Run this in your backend terminal:

```bash
# Test MongoDB connection
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/2k-ai-accounting';
console.log('Testing connection to:', uri);
mongoose.connect(uri)
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log('Database:', mongoose.connection.name);
    console.log('Ready state:', mongoose.connection.readyState);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });
"
```

### Step 4: Check Default Company Exists

Run this in your backend terminal:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({ name: String, email: String });
const Company = mongoose.model('Company', companySchema);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2k-ai-accounting')
  .then(async () => {
    const companies = await Company.find().limit(5);
    if (companies.length === 0) {
      console.log('❌ NO companies found in database!');
      console.log('   Run: node scripts/setup_default_company.mjs');
    } else {
      console.log('✅ Companies found:', companies.length);
      companies.forEach(c => console.log('   -', c.name, '(' + c._id + ')'));
    }
    process.exit(0);
  })
  .catch(err => console.error('Error:', err.message) || process.exit(1));
"
```

### Step 5: Check Backend Server is Running

```bash
# In a new terminal, test the health endpoint
curl http://localhost:5000/health

# Expected response:
# {
#   "success": true,
#   "message": "2K AI Accounting API is running",
#   "environment": "development"
# }
```

### Step 6: Test Backend Endpoint Directly

```bash
curl -X POST http://localhost:5000/api/demo/book \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Company",
    "phone": "+1234567890",
    "preferredDate": "2026-04-25",
    "preferredTime": "14:00",
    "timezone": "UTC"
  }'
```

**Expected success response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "...",
      "name": "Test User",
      "email": "test@example.com",
      "status": "pending"
    }
  },
  "message": "Demo booking created successfully! Check your email for confirmation."
}
```

## Common Error Messages & Fixes

### Error: "No company assigned to this user (or system demo data missing)"

**Cause**: No Company record exists in database

**Fix**:
```bash
cd /path/to/backend
node scripts/setup_default_company.mjs
```

### Error: "Validation failed"

**Cause**: One or more form fields are invalid

**Check**: Look at the `details` array in the error response to see which field failed

**Common issues**:
- Date not in ISO8601 format (must be YYYY-MM-DD)
- Time not in HH:MM format (must be 24-hour)
- Email missing @ symbol
- Name less than 2 characters

### Error: "You already have a demo scheduled..."

**Cause**: This email already has a pending/confirmed booking

**Fix**: Use a different email address or wait for the booking to be completed/cancelled

### Error: "CORS error" or Cannot reach API

**Cause**: Backend not running or CORS not configured

**Fix**: 
1. Start backend: `npm run dev` (in backend directory)
2. Check CORS allowed origins in backend/server.js
3. Verify frontend is using correct API URL (should be `/api/demo/book`, not absolute URL)

## Advanced: Enable Debug Logging

### In Backend (backend/server.js):

Add this after other routes but before error handler:

```javascript
// Debug logging middleware
app.use((err, req, res, next) => {
  console.error('=== REQUEST ERROR ===');
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Body:', req.body);
  console.error('Error:', err);
  console.error('=============================');
  next(err);
});
```

### In Frontend (src/pages/BookDemo.tsx):

Add this in handleSubmit():

```typescript
const response = await fetch('/api/demo/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
});

// Debug log
console.log('Response Status:', response.status);
console.log('Response Headers:', response.headers);
const result = await response.json();
console.log('Response Body:', result);
```

## Ask for Help With

When contacting support, provide:

1. **Status code** from Network tab
2. **Full error message** from response
3. **Request body** (the form data being sent)
4. **Console output** from backend terminal
5. **Backend logs** (if available)

---

**Created**: 2026-04-23  
**For**: 2K AI Accounting System - Demo Booking Feature
