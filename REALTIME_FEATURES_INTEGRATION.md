# Real-Time Features Integration Guide

## Overview
This document outlines the implementation of three major features added to the 2K AI Accounting Systems:
1. Personalized Welcome Messages
2. Real-Time Admin Messaging System
3. Live Forex Integration

## 1. Personalized Welcome Messages

### Implementation
**File:** `src/components/dashboard/WelcomeHero.tsx`

**Features:**
- User personalization with first name from profile
- Time-of-day greeting (morning/afternoon/evening)
- Admin message polling (30-second intervals)
- Admin message banner display

**How it works:**
```typescript
// Fetches user data from AuthContext
const { user } = useAuth();
const userName = user?.user_metadata?.full_name?.split(' ')[0] || 
                 user?.email?.split('@')[0];

// Displays time-appropriate greeting
const greeting = new Date().getHours() < 12 ? '🌅 Good morning' : 
                 new Date().getHours() < 18 ? '☀️ Good afternoon' : 
                 '🌙 Good evening';

// Polls for admin messages every 30 seconds
useEffect(() => {
  const interval = setInterval(fetchAdminMessages, 30000);
  return () => clearInterval(interval);
}, []);
```

**Database:** Uses `admin_messages` table
**API Endpoint:** `GET /api/admin/messages/user/active`

---

## 2. Real-Time Admin Messaging System

### Backend Implementation
**Files:**
- `backend/routes/adminMessaging.js` - API routes
- Database: `admin_messages` table

### API Endpoints

#### Send Message
```
POST /api/admin/messages/send
Content-Type: application/json

{
  "title": "New Feature Launch",
  "message": "We've released a new feature!",
  "link": "https://example.com/feature",
  "recipientType": "all" | "paid" | "free" | "specific",
  "specificUserIds": [] (if recipientType === "specific")
}

Response:
{
  "success": true,
  "sentTo": 1500,
  "messageId": "uuid"
}
```

#### Get All Messages (Admin)
```
GET /api/admin/messages
Authorization: Bearer <admin_token>

Response:
{
  "messages": [{
    "id": "uuid",
    "title": "...",
    "message": "...",
    "status": "sent|archived|deleted",
    "createdAt": "2024-01-15T...",
    "sentTo": 1500
  }]
}
```

#### Get User's Active Messages
```
GET /api/admin/messages/user/active
Authorization: Bearer <user_token>

Response:
{
  "messages": [{
    "id": "uuid",
    "title": "...",
    "message": "...",
    "link": "...",
    "createdAt": "..."
  }]
}
```

#### Dismiss Message
```
PATCH /api/admin/messages/:messageId/dismiss
Authorization: Bearer <user_token>

Response:
{
  "success": true,
  "dismissed": true
}
```

### Frontend Integration
**File:** `src/components/admin/AdminMessagingPanel.tsx`

**Updated to use:**
- `POST /api/admin/messages/send` - Send messages
- `GET /api/admin/messages` - Get message history

**Recipient Targeting:**
```typescript
{
  value: 'all',    // All users
  value: 'paid',   // Users with active paid subscriptions
  value: 'free',   // Users on free tier
  value: 'specific' // Selected users
}
```

### Email Notifications
When messages are sent:
1. Admin message is stored in database
2. User's dashboard displays message in next poll cycle (max 30 seconds)
3. Optional: Send email notifications for high-priority messages

---

## 3. Real-Time Forex Integration

### Backend Implementation
**Files:**
- `backend/services/forexService.js` - Enhanced with 5 new methods
- `backend/routes/forex.js` - Added 5 new endpoints

### New Forex Methods

#### 1. Update Transaction with Current Rates
```typescript
const updated = await forexService.updateTransactionWithCurrentRates(
  { amount: 1000, currency: 'UGX' },
  'USD'
);
// Returns: {
//   amount: 1000,
//   currency: 'UGX',
//   convertedAmount: 0.27,
//   conversionRate: 0.00027,
//   lastUpdated: '2024-01-15T10:30:00Z'
// }
```

#### 2. Batch Update Transactions
```typescript
const transactions = [
  { amount: 1000, currency: 'UGX' },
  { amount: 500, currency: 'KES' }
];
const updated = await forexService.batchUpdateTransactions(
  transactions,
  'USD'
);
// Processes all transactions in parallel for efficiency
```

#### 3. Get Exchange Rate Trend (7-day history)
```typescript
const trend = await forexService.getExchangeRateTrend('USD', 'UGX', 7);
// Returns: [
//   { date: '2024-01-08', rate: 3700, timestamp: '...' },
//   { date: '2024-01-09', rate: 3710, timestamp: '...' },
//   ...
// ]
```

#### 4. Subscribe to Real-Time Updates
```typescript
const unsubscribe = forexService.subscribeToRealTimeUpdates(
  (rates) => {
    console.log('Updated rates:', rates);
  },
  60000 // 60 second interval
);

// Later: unsubscribe();
```

#### 5. Get Forex Statistics
```typescript
const stats = await forexService.getForexStats();
// Returns:
// {
//   majorPairs: {
//     'USD/EUR': { rate: 0.92, change: -0.5, trend: [...] },
//     'USD/GBP': { rate: 0.79, change: 0.2, trend: [...] },
//     ...
//   },
//   africaCurrencies: {
//     'USD/UGX': { rate: 3750, change: 0.1, trend: [...] },
//     ...
//   }
// }
```

### API Endpoints

#### Get Current Rates
```
GET /api/forex/rates?base=USD
Response: { "rates": { "EUR": 0.92, "GBP": 0.79, ... } }
```

#### Convert Currency
```
GET /api/forex/convert?amount=1000&from=UGX&to=USD
Response: { "converted": 0.27, "rate": 0.00027 }
```

#### Update Transaction with Current Rates
```
POST /api/forex/update-transaction
{
  "amount": 1000,
  "fromCurrency": "UGX",
  "toCurrency": "USD"
}
Response: {
  "convertedAmount": 0.27,
  "conversionRate": 0.00027,,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

#### Batch Update Transactions
```
POST /api/forex/batch-update
{
  "transactions": [
    { "amount": 1000, "currency": "UGX" },
    { "amount": 500, "currency": "KES" }
  ],
  "toCurrency": "USD"
}
Response: {
  "count": 2,
  "transactions": [...]
}
```

#### Get Exchange Rate Trend
```
GET /api/forex/trend?from=USD&to=UGX&days=7
Response: {
  "trend": [
    { "date": "2024-01-08", "rate": 3700 },
    ...
  ]
}
```

#### Get Forex Statistics
```
GET /api/forex/stats
Response: {
  "majorPairs": {...},
  "africaCurrencies": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Frontend Components

#### 1. RealTimeForexRates Component
**File:** `src/components/dashboard/RealTimeForexRates.tsx`

Displays:
- Major currency pairs with live rates
- African market currencies
- Change percentages (green/red indicators)
- 7-day trend charts
- Auto-refresh every 60 seconds

Usage:
```tsx
import RealTimeForexRates from '@/components/dashboard/RealTimeForexRates';

<RealTimeForexRates />
```

#### 2. TransactionForexDisplay Component
**File:** `src/components/dashboard/TransactionForexDisplay.tsx`

Displays:
- Original amount and currency
- Exchange rate used
- Converted amount
- Last update timestamp
- Refresh button for live rate updates
- Stale data warning (>30 minutes old)

Two modes:
- **Full mode** (default): Large display with all details
- **Compact mode** (showRate={true}): Inline display for transaction lists

Usage:
```tsx
import TransactionForexDisplay from '@/components/dashboard/TransactionForexDisplay';

// Full display
<TransactionForexDisplay 
  transaction={transaction}
  targetCurrency="USD"
/>

// Compact display in transaction list
<TransactionForexDisplay 
  transaction={transaction}
  compact={true}
  showRate={true}
/>
```

---

## 4. Transaction Forex Integration

### How It Works

The forex integration is seamlessly built into the transaction display system:

1. **TransactionCard** (`src/components/TransactionCard.tsx`)
   - Displays original amount and currency
   - Shows converted USD amount when forex data is available
   - Displays exchange rate used
   - Badge showing "Stale" if data is older than 30 minutes

2. **TransactionList** (`src/components/transactions/TransactionList.tsx`)
   - Fetches forex rates for all transactions via `updateTransactionsBatch()`
   - Shows "Refresh Rates" button for manual updates
   - Displays converted totals in summary
   - Auto-updates on mount and when transactions change

3. **TransactionSummary** (`src/components/transactions/TransactionSummary.tsx`)
   - Shows original income/expense totals
   - Displays USD-converted totals when forex data available
   - Color-coded for easy distinction

4. **TransactionDetail** (`src/components/transactions/TransactionDetail.tsx`)
   - Full transaction view with detailed forex information
   - 7-day exchange rate trend chart
   - Item-level breakdown when available
   - Manual refresh button

### Hook: useForexTransactions

**File:** `src/hooks/useForexTransactions.ts`

```typescript
const {
  loading,
  error,
  updateTransactionRates,      // Single transaction
  updateTransactionsBatch,     // Multiple transactions
  getForexTrend,              // 7-day historical data
  getForexStats,              // Dashboard statistics
  isTransactionDataStale,     // Check if data > 30min old
} = useForexTransactions();
```

**Usage Examples:**

```typescript
// Update single transaction
const updated = await updateTransactionRates(
  { amount: 1000, currency: 'UGX' },
  'USD'
);

// Batch update multiple
const updated = await updateTransactionsBatch(
  transactions,
  'USD'
);

// Get 7-day trend
const trend = await getForexTrend('UGX', 'USD', 7);

// Check if stale
const isStale = isTransactionDataStale(transaction);
```

### Component Usage

#### In TransactionList
```tsx
<TransactionList 
  transactions={transactions}
  showForexRates={true}
  targetCurrency="USD"
  onEditTransaction={handleEdit}
  onDeleteTransaction={handleDelete}
/>
```

#### In TransactionDetail Modal
```tsx
import TransactionDetail from '@/components/transactions/TransactionDetail';

<TransactionDetail 
  transaction={selectedTransaction}
  onClose={() => setShowDetail(false)}
/>
```

### Real-World Example Flow

1. User navigates to Transactions page
2. `TransactionList` loads 20 transactions
3. `updateTransactionsBatch()` fetches forex rates for all 20 in parallel
4. Each `TransactionCard` displays:
   - Original: "1,000 UGX"
   - Converted: "= -0.27 USD"
   - Rate: "@ 0.00027"
5. User clicks "Refresh Rates" button
6. All rates updated with current market data
7. If > 30 minutes old, "Stale" badge appears
8. User clicks transaction → Opens `TransactionDetail`
9. Shows 7-day trend chart for UGX/USD
10. User can see how exchange rate changed over week

---

### Transaction Data Structure

```typescript
interface Transaction {
  id: string;
  amount: number;              // Amount in transaction currency
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  currency?: string;           // Transaction currency (EUR, UGX, etc)
  original_amount?: number;    // Amount in original currency
  original_currency?: string;  // Original currency code
  
  // Forex fields (populated by updateTransactionRates)
  convertedAmount?: number;    // Amount converted to USD
  conversionRate?: number;     // Rate used (e.g., 0.00027)
  lastUpdated?: string;        // ISO timestamp of last update
  
  // Additional data
  metadata?: {
    vendor?: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    taxAmount?: number;
    subtotal?: number;
  };
}
```

---

### admin_messages Table
```sql
CREATE TABLE admin_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (users table),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active', -- active|archived|deleted
  created_by UUID NOT NULL (admin user),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  dismissed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_admin_messages_user_id_status ON admin_messages(user_id, status);
CREATE INDEX idx_admin_messages_created_at ON admin_messages(created_at DESC);

-- RLS Policies
- Users can only see their own messages
- Users can dismiss their own messages
- Admins can insert messages
- Admins can view all messages
```

### forex_rates Table
```sql
CREATE TABLE forex_rates (
  id UUID PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  change_percent DECIMAL(6, 4),
  source VARCHAR(50),
  fetched_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_forex_rates_currency_pair ON forex_rates(from_currency, to_currency, fetched_at DESC);
```

---

## 5. Environment Configuration

Required environment variables:

```bash
# Forex Services
EXCHANGE_RATE_API_KEY=your_openexchangerates_key
OPENEXCHANGERATES_API_KEY=your_key
FIXER_API_KEY=your_fixer_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 6. Testing

### Test Admin Messages
```bash
# Send message to all users
curl -X POST http://localhost:3000/api/admin/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "Test",
    "message": "Test message",
    "recipientType": "all"
  }'

# Fetch user messages
curl -X GET http://localhost:3000/api/admin/messages/user/active \
  -H "Authorization: Bearer <user_token>"
```

### Test Forex Updates
```bash
# Update transaction with live rates
curl -X POST http://localhost:3000/api/forex/update-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "fromCurrency": "UGX",
    "toCurrency": "USD"
  }'

# Get forex stats
curl -X GET http://localhost:3000/api/forex/stats \
  -H "Authorization: Bearer <user_token>"
```

---

## 7. Deployment Checklist

- [ ] Run Supabase migrations for `admin_messages` and `forex_rates` tables
- [ ] Set environment variables for forex API keys
- [ ] Add admin messaging routes to Express server
- [ ] Test admin messaging endpoints
- [ ] Deploy frontend components (RealTimeForexRates, TransactionForexDisplay)
- [ ] Test real-time forex updates
- [ ] Monitor forex API rate limits
- [ ] Test message polling in WelcomeHero component
- [ ] Verify RLS policies on Supabase tables
- [ ] Update user documentation with new features

---

## 8. Performance Notes

**Message Polling:**
- 30-second intervals in dashboard (configurable)
- Reduces server load vs. WebSocket connections
- Can be switched to Supabase real-time listeners for instant updates

**Forex Rate Updates:**
- 60-second refresh intervals by default
- Caching with 5-minute TTL
- Fallback chain: OpenExchangeRates → ExchangeRate-API → Fixer → Historical

**Batch Operations:**
- `batchUpdateTransactions()` uses `Promise.all()` for parallel processing
- More efficient than individual API calls for large transaction lists

---

## 9. Future Enhancements

- [ ] WebSocket support for instant message delivery
- [ ] Message scheduling and frequency control
- [ ] Real-time rate subscriptions using Supabase listeners
- [ ] A/B testing for message variations
- [ ] Analytics dashboard for message engagement
- [ ] Multi-language message support
- [ ] Rich text editor for messages
- [ ] Message templates and approval workflow

---

**Last Updated:** January 15, 2024
**Version:** 1.0.0
