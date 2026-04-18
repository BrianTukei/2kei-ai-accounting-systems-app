# Google AI Studio Integration - Setup Guide

## System Integrated Features

Your 2K AI Accounting System now includes Google Gemini AI capabilities:

✅ **Receipt Intelligence** - Extract structured data from receipt OCR  
✅ **Financial Analysis** - Natural language financial queries  
✅ **Email Generation** - Professional email drafting  
✅ **Anomaly Detection** - Fraud and error detection  
✅ **Auto-Categorization** - Intelligent transaction classification  

---

## Step 1: Get Your Google API Key

### 1.1 Go to Google AI Studio

Visit: **https://aistudio.google.com**

### 1.2 Sign In with Google

- Log in with your Google account
- If you don't have one, create a new Google account

### 1.3 Create API Key

- Click **"Get API Key"** button
- Select **"Create API key in new project"**
- Copy the API key (starts with `AIza...`)

### 1.4 Security Note

⚠️ **IMPORTANT**: Never commit your API key to GitHub!

---

## Step 2: Configure Your Environment

### 2.1 Add to .env File

Open your `.env` file in the root directory:

```bash
# Google AI Studio
GOOGLE_API_KEY=your_api_key_here
```

Example with actual key format:
```bash
GOOGLE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.2 Verify Environment Variable

Test that your key is loaded:

```bash
node -e "require('dotenv').config(); console.log('API Key loaded:', !!process.env.GOOGLE_API_KEY)"
```

Expected output:
```
API Key loaded: true
```

---

## Step 3: API Endpoints

All AI features are available via REST API at `/api/ai/*`

### 3.1 Parse Receipt (Receipt Intelligence)

**Endpoint:** `POST /api/ai/parse-receipt`

**Request:**
```json
{
  "receipt_text": "Your Store\nDate: 2026-04-18\nItem 1 - 50000\nItem 2 - 75000\nTotal: 125000 UGX"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor_name": "Your Store",
    "date": "2026-04-18",
    "items": [
      {"name": "Item 1", "quantity": 1, "unit_price": 50000, "total": 50000},
      {"name": "Item 2", "quantity": 1, "unit_price": 75000, "total": 75000}
    ],
    "subtotal": 125000,
    "tax": null,
    "total": 125000,
    "currency": "UGX",
    "category": "Expenses"
  }
}
```

### 3.2 Analyze Financials (Financial Query Engine)

**Endpoint:** `POST /api/ai/analyze-financials`

**Request:**
```json
{
  "query": "What were my total expenses last month?",
  "transactions": [
    {"date": "2026-04-01", "type": "expense", "amount": 50000, "description": "Internet"},
    {"date": "2026-04-05", "type": "expense", "amount": 200000, "description": "Transport"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": "Based on your transactions, your total expenses last month were 250,000 UGX..."
}
```

### 3.3 Generate Email (Email Intelligence)

**Endpoint:** `POST /api/ai/generate-email`

**Request:**
```json
{
  "type": "payment_reminder",
  "recipientName": "John Doe",
  "amount": 450000,
  "dueDate": "2026-04-20",
  "tone": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "payment_reminder",
    "body": "Dear John Doe,\n\nWe hope you're doing well. This is a friendly reminder..."
  }
}
```

### 3.4 Detect Anomalies (Fraud Detection)

**Endpoint:** `POST /api/ai/detect-anomalies`

**Request:**
```json
{
  "transactions": [
    {"id": 1, "amount": 50000, "date": "2026-04-01", "description": "Fuel"},
    {"id": 2, "amount": 50000, "date": "2026-04-01", "description": "Fuel"},
    {"id": 3, "amount": 5000000, "date": "2026-04-02", "description": "Transport"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "anomalies_detected": true,
    "severity": "high",
    "findings": [
      {
        "type": "duplicate",
        "description": "Exact duplicate transactions detected",
        "affected_transactions": [1, 2],
        "recommendation": "Review and remove one duplicate transaction"
      },
      {
        "type": "unusual_amount",
        "description": "Amount is 100x higher than typical",
        "affected_transactions": [3],
        "recommendation": "Verify transaction authenticity"
      }
    ],
    "risk_score": 85
  }
}
```

### 3.5 Categorize Transaction (Auto-Classification)

**Endpoint:** `POST /api/ai/categorize-transaction`

**Request:**
```json
{
  "description": "Monthly office rent payment to landlord",
  "amount": 500000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "Rent"
  }
}
```

### 3.6 Check Service Status

**Endpoint:** `GET /api/ai/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "ready": true,
    "model": "gemini-1.5-pro",
    "message": "Google AI Service is operational"
  }
}
```

---

## Step 4: Integration in Frontend

### 4.1 Receipt Scanner Example (React)

```jsx
import { useState } from 'react';

export function ReceiptScanner() {
  const [receipt, setReceipt] = useState(null);

  const handleParseReceipt = async (ocrText) => {
    const response = await fetch('/api/ai/parse-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        receipt_text: ocrText
      })
    });

    const data = await response.json();
    if (data.success) {
      setReceipt(data.data);
    }
  };

  return (
    <div>
      <button onClick={() => handleParseReceipt('...')}>
        Parse Receipt
      </button>
      {receipt && <pre>{JSON.stringify(receipt, null, 2)}</pre>}
    </div>
  );
}
```

### 4.2 Financial Query Example

```jsx
const handleAskQuestion = async (question) => {
  const response = await fetch('/api/ai/analyze-financials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      query: question,
      transactions: userTransactions
    })
  });

  const data = await response.json();
  console.log(data.data); // AI analysis
};
```

---

## Step 5: Troubleshooting

### Issue: "Google AI Service is not available"

**Solution:**
```bash
# 1. Check .env file has GOOGLE_API_KEY
cat .env | grep GOOGLE_API_KEY

# 2. Verify API key format (should start with AIza)
# 3. Check key has Generative Language API enabled in Google Cloud

# 4. Restart backend
node backend/server.js
```

### Issue: "Invalid API Key"

**Solution:**
- Go back to https://aistudio.google.com
- Generate a new API key
- Update .env file
- Restart backend

### Issue: Rate Limiting (429 error)

**Note:** Free tier has rate limits. Upgrade to paid plan for production:
https://cloud.google.com/generative-ai

---

## Step 6: Monitoring & Logging

All AI operations are logged. Check logs:

```bash
# View real-time logs
tail -f logs/app.log | grep "Google AI"

# Parse successful receipts
tail -f logs/app.log | grep "Receipt parsed"

# Anomaly detection results
tail -f logs/app.log | grep "Anomaly detection"
```

---

## Step 7: Production Best Practices

### 🔒 Security

- ✅ Never commit API key to Git
- ✅ Use environment variables only
- ✅ Regenerate keys if exposed
- ✅ Restrict API key to specific APIs in Google Cloud Console

### ⚡ Performance

- ✅ Batch requests when possible
- ✅ Cache results for repeated queries
- ✅ Implement request queuing for high volume
- ✅ Monitor rate limits

### 💰 Cost Management

- ✅ Monitor API usage on Google Cloud Console
- ✅ Set up billing alerts
- ✅ Use caching to reduce API calls
- ✅ Consider enterprise plan for predictable costs

---

## Support

- **Google AI Documentation:** https://ai.google.dev/docs
- **API Reference:** https://ai.google.dev/api/python/google/generativeai
- **Rate Limits:** https://ai.google.dev/pricing
- **System Issues:** Check the main README.md

---

## Quick Start (Complete)

```bash
# 1. Get API key from https://aistudio.google.com
# 2. Add to .env
echo "GOOGLE_API_KEY=your_key_here" >> .env

# 3. Backend runs Google AI services automatically
node backend/server.js

# 4. Test the service
curl -X GET http://localhost:5000/api/ai/status

# 5. Use in your application
# See examples above
```

---

**Status:** ✅ Ready for enterprise use  
**Last Updated:** April 18, 2026  
**Version:** 1.0.0
