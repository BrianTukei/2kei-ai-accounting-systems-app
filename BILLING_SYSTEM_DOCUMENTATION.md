# 2K AI Accounting - Billing & Subscription System Documentation

## 🎯 System Overview

Complete, production-ready billing and subscription system optimized for SMEs in Uganda with support for MTN Mobile Money, Airtel Money, and freemium model.

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Payment Integration](#payment-integration)
5. [Frontend Components](#frontend-components)
6. [Setup & Installation](#setup--installation)
7. [Usage Examples](#usage-examples)
8. [Admin Features](#admin-features)

---

## 🏗️ Architecture

### System Layers

```
┌─────────────────────────────────────────────┐
│         Frontend (React/TypeScript)         │
│  - Pricing Page                             │
│  - Payment Checkout                         │
│  - Usage Dashboard                          │
│  - Demo Booking                             │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│       Backend API (Node.js/Express)         │
│  - Billing Routes                           │
│  - Subscription Management                  │
│  - Payment Processing                       │
│  - Usage Tracking                           │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│   Services & Business Logic                 │
│  - BillingService (subscriptions)           │
│  - MobileMoneyService (payments)            │
│  - Usage Tracking                           │
│  - AI Credits Management                    │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│    External Services                        │
│  - Flutterwave (Payment Provider)           │
│  - MTN Mobile Money API                     │
│  - Airtel Money API                         │
│  - Supabase (Database)                      │
└─────────────────────────────────────────────┘
```

### Key Features

- **Freemium Model**: Free tier with 50 transactions/month limit
- **4 Pricing Tiers**: Free → Starter → Business → Enterprise
- **Mobile Money First**: Accepts MTN MoMo and Airtel Money
- **AI Credits System**: Pay-as-you-go AI feature usage
- **Monthly Usage Tracking**: Automatic transaction counting
- **Subscription Auto-Renewal**: Automatic billing on due date
- **Grace Period**: 3-5 days after expiry before downgrade
- **Admin Dashboard**: Full revenue analytics and user management

---

## 📊 Database Schema

### Core Tables

#### 1. **pricing_plans**
```sql
- id (UUID, PK)
- name (VARCHAR) - "Free", "Starter", "Business", "Enterprise"
- slug (VARCHAR) - "free", "starter", "business", "enterprise"
- monthly_price (DECIMAL)
- yearly_price (DECIMAL)
- transaction_limit (INT)
- features (JSONB)
- display_order (INT)
```

**Features Object:**
```json
{
  "transactions": 50,
  "reports": ["basic"],
  "support": "community",
  "ai_features": false,
  "multi_user": 1,
  "ai_credits": 0,
  "crm": false
}
```

#### 2. **subscriptions**
```sql
- id (UUID, PK)
- user_id (UUID, FK) → auth.users
- plan_id (UUID, FK) → pricing_plans
- billing_cycle (VARCHAR) - "monthly", "yearly"
- start_date (DATE)
- end_date (DATE)
- grace_period_end (DATE)
- status (VARCHAR) - "active", "canceled", "expired", "paused"
- auto_renew (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Status Lifecycle:**
```
active → [grace_period] → expired → [downgrade] → free
                      ↓
                   canceled
```

#### 3. **payments**
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- subscription_id (UUID, FK)
- amount (DECIMAL)
- currency (VARCHAR) - "UGX"
- payment_method (VARCHAR) - "mobile_money", "card", "bank_transfer"
- provider (VARCHAR) - "mtn", "airtel", "stripe"
- phone_number (VARCHAR)
- transaction_reference (VARCHAR, UNIQUE)
- status (VARCHAR) - "pending", "success", "failed", "refunded"
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Metadata Structure:**
```json
{
  "provider": "mtn",
  "amount": 15000,
  "transaction_id": "xyz123",
  "network": "MTN"
}
```

#### 4. **monthly_usage**
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- year (INT)
- month (INT) - 1-12
- transaction_count (INT)
- ai_requests_count (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, year, month)
```

#### 5. **ai_credits**
```sql
- id (UUID, PK)
- user_id (UUID, FK, UNIQUE)
- balance (DECIMAL) - Current balance in UGX
- total_purchased (DECIMAL)
- total_used (DECIMAL)
- last_refilled_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Credit Pricing:**
- 1 AI request = 500 UGX
- Bundles: 100k, 500k, 1M, 5M credits
- Starter plan includes 100k credits/month
- Business plan includes 1M credits/month

#### 6. **ai_usage_history**
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- feature (VARCHAR) - "receipt_scanning", "categorization", "banking_import"
- credits_used (DECIMAL)
- request_data (JSONB)
- status (VARCHAR) - "completed", "failed"
- created_at (TIMESTAMP)
```

#### 7. **demo_bookings**
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- business_name (VARCHAR)
- preferred_date (DATE)
- timezone (VARCHAR)
- notes (TEXT)
- status (VARCHAR) - "pending", "scheduled", "completed", "canceled"
- assigned_to (UUID, FK) → auth.users
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 8. **billing_history**
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- subscription_id (UUID, FK)
- action (VARCHAR) - "upgraded", "downgraded", "renewed", "canceled"
- from_plan (VARCHAR)
- to_plan (VARCHAR)
- amount (DECIMAL)
- notes (TEXT)
- created_at (TIMESTAMP)
```

---

## 🔌 API Endpoints

### User Endpoints (Authenticated)

#### Subscriptions
```
GET  /api/billing/subscription              # Get current subscription
GET  /api/billing/plans                     # Get all pricing plans
POST /api/billing/upgrade                   # Upgrade subscription
POST /api/billing/cancel                    # Cancel subscription
```

#### Payments
```
POST /api/billing/payment/mtn                # Initiate MTN payment
POST /api/billing/payment/airtel             # Initiate Airtel payment
GET  /api/billing/payment/:transactionId/verify  # Verify payment status
GET  /api/billing/payments                  # Get payment history
```

#### Usage
```
GET  /api/billing/usage                     # Get monthly usage
```

#### AI Credits
```
GET  /api/billing/credits                   # Get credit balance
GET  /api/billing/credits/history           # Get usage history
POST /api/billing/credits/use                # Use credits for feature
POST /api/billing/credits/purchase           # Purchase credits
```

#### Demo Booking
```
POST /api/billing/demo-booking              # Submit demo request
```

### Admin Endpoints (Admin Only)

```
GET  /api/billing/admin/subscriptions       # View all subscriptions
GET  /api/billing/admin/revenue             # Revenue metrics
GET  /api/billing/admin/demo-bookings       # View all demo requests
PATCH /api/billing/admin/demo-bookings/:id  # Update demo booking
POST /api/billing/admin/users/:userId/upgrade # Manual upgrade
```

---

## 💳 Payment Integration

### Supported Providers

#### 1. **MTN Mobile Money**
- **Network**: MTN Uganda
- **Dial Code**: *165#
- **API**: Flutterwave (fallback to direct MTN API)
- **Transaction Time**: Instant
- **Fees**: 0-5% (varies by amount)

#### 2. **Airtel Money**
- **Network**: Airtel Uganda
- **Dial Code**: *185#
- **API**: Flutterwave (fallback to direct Airtel API)
- **Transaction Time**: Instant
- **Fees**: 0-5% (varies by amount)

### Payment Flow

```
User Selects Plan
        ↓
[Pricing Page] → Displays all plans
        ↓
User Clicks "Get Started"
        ↓
[Payment Page] → User enters phone number
        ↓
User Selects Payment Method
        ↓
[MTN/Airtel] → User receives prompt on phone
        ↓
User Confirms on Phone
        ↓
[Backend] → Verify payment via API
        ↓
[Auto-Activate] → Subscription starts immediately
        ↓
[Dashboard] → User sees new plan active
```

### Implementation Details

#### Flutterwave Configuration
```javascript
// backend/services/mobileMoneyService.js
{
  baseUrl: 'https://api.flutterwave.com/v3',
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
}
```

#### Environment Variables Required
```
FLUTTERWAVE_SECRET_KEY=sk_live_xxxxx
FLUTTERWAVE_PUBLIC_KEY=pk_live_xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxx
MTN_MOMO_API_KEY=xxxxx
MTN_MOMO_API_SECRET=xxxxx
AIRTEL_MONEY_CLIENT_ID=xxxxx
AIRTEL_MONEY_CLIENT_SECRET=xxxxx
```

---

## 🎨 Frontend Components

### 1. **Pricing Page** (`/pages/Pricing.tsx`)
- Display all 4 pricing plans
- Monthly / Yearly toggle (10% discount)
- Feature comparison matrix
- CTAs for upgrading
- Mobile-first design
- Dark mode support

**Features:**
- Real-time plan fetching
- Current user's plan highlighting
- Free plan defaulting on signup
- FAQ section

### 2. **Payment Checkout** (`/pages/Payment.tsx`)
- Select payment method (MTN/Airtel)
- Enter phone number
- Real-time payment status
- Processing animation
- Auto-redirect on success
- Retry logic for failed payments

**User Experience:**
1. Select payment provider
2. Enter phone number
3. System initiates payment
4. Receive prompt on phone
5. Complete payment on phone
6. Automatic activation

### 3. **Billing Dashboard** (`/pages/Billing.tsx`)
- Current subscription details
- Monthly transaction counting
- AI credits balance
- Payment history
- Usage warnings
- Upgrade/cancel buttons

**Tabs:**
- **Usage**: Transaction count, AI requests
- **Credits**: Balance, purchases, history
- **History**: Payment records, export

### 4. **Demo Booking** (`/pages/BookDemo.tsx`)
- Name, email, phone, business
- Calendar date picker
- Timezone selection
- Additional notes
- Confirmation page
- Admin notification

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Flutterwave account
- MTN MoMo developer account
- Airtel Money developer account

### 1. Database Setup

```bash
# Run migrations in Supabase console
supabase/migrations/001_create_billing_tables.sql

# Verify tables created
SELECT * FROM pricing_plans;
SELECT COUNT(*) FROM subscriptions;
```

### 2. Environment Variables

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Payment Providers
FLUTTERWAVE_SECRET_KEY=sk_live_xxxxx
FLUTTERWAVE_PUBLIC_KEY=pk_live_xxxxx
MTN_MOMO_API_KEY=xxxxx
AIRTEL_MONEY_CLIENT_ID=xxxxx

# URLs
APP_URL=http://localhost:3000
BASE_URL=http://localhost:5000
```

### 3. Backend Setup

```bash
# Install dependencies
npm install

# Add billing routes to server.js
const billingRoutes = require('./routes/billingRoutes');
app.use('/api/billing', billingRoutes);

# Start server
npm run dev
```

### 4. Frontend Integration

```bash
# Add routes to App.tsx
import Pricing from '@/pages/Pricing';
import Payment from '@/pages/Payment';
import Billing from '@/pages/Billing';
import BookDemo from '@/pages/BookDemo';

<Route path="/pricing" element={<Pricing />} />
<Route path="/billing/payment" element={<Payment />} />
<Route path="/billing" element={<Billing />} />
<Route path="/book-demo" element={<BookDemo />} />
```

---

## 📖 Usage Examples

### 1. Subscribe User to Free Plan (On Signup)

```typescript
// services/billingService.ts
const freePlan = await supabase
  .from('pricing_plans')
  .select('id')
  .eq('slug', 'free')
  .single();

await createSubscription(userId, freePlan.id, 'monthly');
```

### 2. Track Transaction

```typescript
// User creates transaction
await trackTransaction(userId);

// Returns:
// { limited: false }  ← OK to continue
// OR
// { limited: true, limit: 50 }  ← Show upgrade prompt
```

### 3. Upgrade Subscription

```typescript
const newPlan = 'starter';
await manuallyUpgradeUser(userId, newPlan);

// Logs to billing_history
// Auto-activates
// Sends confirmation email
```

### 4. Use AI Credits

```typescript
try {
  await useAICredits(userId, 'receipt_scanning', 500);
  // Success - process AI request
} catch (error) {
  // Insufficient credits
  showUpgradePrompt();
}
```

### 5. Check Subscription Status

```typescript
const status = await checkSubscriptionExpiry(userId);

// Returns:
// { plan: 'starter', expired: false }
// OR
// { plan: 'free', expired: true }
// OR
// { plan: 'starter', inGracePeriod: true }
```

---

## 👨‍💼 Admin Features

### Admin Dashboard Routes

#### View All Subscriptions
```bash
GET /api/billing/admin/subscriptions
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user": { "id": "uuid", "email": "user@example.com" },
    "plan": { "name": "Starter", "monthly_price": 15000 },
    "status": "active",
    "end_date": "2024-05-01",
    "billing_cycle": "monthly"
  }
]
```

#### Revenue Analytics
```bash
GET /api/billing/admin/revenue?startDate=2024-04-01&endDate=2024-04-30
```

**Response:**
```json
{
  "totalRevenue": 1500000,
  "transactionCount": 45,
  "paymentsByProvider": {
    "mtn": 750000,
    "airtel": 500000,
    "stripe": 250000
  }
}
```

#### Manage Demo Bookings
```bash
GET /api/billing/admin/demo-bookings?status=pending
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "business_name": "Tech Solutions Ltd",
    "preferred_date": "2024-05-15",
    "status": "pending",
    "created_at": "2024-04-20T10:30:00Z"
  }
]
```

#### Manual User Upgrade
```bash
POST /api/billing/admin/users/{userId}/upgrade
{ "planSlug": "business" }
```

---

## 🔐 Security Considerations

### Payment Security
- ✅ Webhook signature verification
- ✅ Reference ID validation
- ✅ Amount verification
- ✅ Phone number validation
- ✅ Rate limiting on payment endpoints

### Data Protection
- ✅ Encrypted payment data in transit (HTTPS/TLS)
- ✅ PCI-DSS compliance-ready
- ✅ No storage of sensitive card data
- ✅ Audit trail of all transactions
- ✅ Admin action logging

### Best Practices

```javascript
// 1. Verify webhook signature
if (!verifyWebhookSignature(payload, signature)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// 2. Verify payment amount
if (payment.amount !== expectedAmount) {
  throw new Error('Amount mismatch - fraud attempt');
}

// 3. Validate user before updating subscription
const user = await getUser(userId);
if (!user) throw new Error('User not found');

// 4. Log all billing changes
await logBillingHistory(userId, action, fromPlan, toPlan);
```

---

## 📱 Mobile Optimization

### Responsive Design
- ✅ Mobile-first approach
- ✅ Touch-friendly buttons (min 48px)
- ✅ Simplified forms for small screens
- ✅ Fast checkout (2-3 screens max)
- ✅ Large payment buttons

### Performance
- ✅ Lazy loading of pricing page
- ✅ Optimized API response caching
- ✅ Database query optimization (indexes)
- ✅ CDN for static assets

---

## 🧪 Testing

### Payment Testing (Sandbox)

**MTN Test Numbers:**
```
+256701000000 (Success)
+256702000000 (Failed)
```

**Airtel Test Numbers:**
```
+256703000000 (Success)
+256704000000 (Failed)
```

### Test Transactions
```bash
# Test successful payment
POST /api/billing/payment/mtn
{
  "phoneNumber": "+256701000000",
  "amount": 15000,
  "planSlug": "starter"
}

# Test payment verification
GET /api/billing/payment/{transactionId}/verify
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rate**
   - Free → Paid conversions
   - Feature adoption rate

2. **Revenue Metrics**
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR)
   - ARPU (Average Revenue Per User)

3. **Payment Metrics**
   - Failed payment rate
   - Retry success rate
   - Payment methods usage

4. **Churn**
   - Monthly churn rate
   - Reasons for cancellation
   - Win-back opportunities

### Query Examples

```sql
-- Active subscribers by plan
SELECT 
  p.name,
  COUNT(s.id) as count,
  SUM(p.monthly_price) as mrr
FROM subscriptions s
JOIN pricing_plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.name;

-- Revenue by period
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as revenue,
  COUNT(*) as transactions
FROM payments
WHERE status = 'success'
GROUP BY month
ORDER BY month DESC;

-- Plan upgrade funnel
SELECT
  from_plan,
  to_plan,
  COUNT(*) as upgrades,
  AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER(ORDER BY created_at)))/86400) as days_to_upgrade
FROM billing_history
WHERE action IN ('upgraded', 'downgraded')
GROUP BY from_plan, to_plan;
```

---

## 🐛 Troubleshooting

### Common Issues

#### Payment Not Processing
1. Check Flutterwave API keys
2. Verify phone number format (+256...)
3. Check network availability
4. Review payment logs

#### Subscription Not Activating
1. Verify payment status is "success"
2. Check plan ID exists
3. Review CreateSubscription logic
4. Check user ID validation

#### AI Credits Not Deducting
1. Verify credits balance > 0
2. Check credit usage logged
3. Review fee calculation
4. Monitor database transactions

#### Users Downgraded Unexpectedly
1. Check grace period expiry date
2. Verify auto-renew settings
3. Review subscription status updates
4. Check billing history logs

---

## 📚 Related Documentation

- [Flutterwave Docs](https://developer.flutterwave.com)
- [MTN MoMo API](https://momodeveloper.mtn.com)
- [Airtel Money API](https://developers.airtel.africa)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## 🤝 Support

For questions or issues:
1. Check troubleshooting section
2. Review database logs
3. Check payment provider dashboards
4. Contact support team

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Production Ready
