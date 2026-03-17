# 2K AI Accounting System - Documentation

A comprehensive AI-powered accounting system built with Node.js, Express, MongoDB, and React.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [Setup Instructions](#setup-instructions)
6. [Environment Variables](#environment-variables)
7. [Features](#features)

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │────▶│  Express API    │────▶│   MongoDB       │
│   (Vite)         │     │   (Node.js)     │     │   (Mongoose)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Company Context │     │  Forex Service   │     │  Transaction    │
│  Auth Context    │     │  JWT Auth        │     │  Subscription   │
│  Currency Ctx    │     │  Validation      │     │  Company        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Design Pattern:** MVC (Model-View-Controller)  
**Authentication:** JWT with refresh tokens  
**Currency:** Multi-currency support with real-time forex  
**AI Ready:** Structured for future AI/ML integration

---

## Folder Structure

```
2K-AI-Accounting-Systems/
│
├── backend/                    # Node.js/Express Backend
│   ├── controllers/             # Request handlers
│   │   ├── companyController.js
│   │   ├── subscriptionController.js
│   │   ├── transactionController.js
│   │   └── authController.js
│   │
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Subscription.js
│   │   ├── Transaction.js
│   │   └── Account.js
│   │
│   ├── routes/                  # API routes
│   │   ├── company.js
│   │   ├── subscription.js
│   │   ├── forex.js
│   │   ├── transactions.js
│   │   └── auth.js
│   │
│   ├── services/                # Business logic
│   │   ├── forexService.js
│   │   ├── emailService.js
│   │   └── aiService.js
│   │
│   ├── middleware/              # Express middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   │
│   ├── utils/                   # Utilities
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   └── constants.js
│   │
│   └── server.js                # Entry point
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── company/
│   │   │   │   ├── CompanyOnboardingForm.jsx
│   │   │   │   ├── CompanyInfo.jsx
│   │   │   │   └── CompanySettings.jsx
│   │   │   │
│   │   │   ├── currency/
│   │   │   │   ├── MultiCurrencyInput.jsx
│   │   │   │   ├── CurrencySelector.jsx
│   │   │   │   └── CurrencyDisplay.jsx
│   │   │   │
│   │   │   ├── subscription/
│   │   │   │   ├── PlanUpgrade.jsx
│   │   │   │   ├── SubscriptionStatus.jsx
│   │   │   │   └── UsageStats.jsx
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   ├── TransactionForm.jsx
│   │   │   │   ├── TransactionList.jsx
│   │   │   │   └── TransactionDetail.jsx
│   │   │   │
│   │   │   └── ui/              # shadcn/ui components
│   │   │
│   │   ├── contexts/
│   │   │   ├── CompanyContext.jsx
│   │   │   ├── AuthContext.jsx
│   │   │   └── CurrencyContext.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── forexService.js
│   │   │   └── companyService.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Billing.jsx
│   │   │
│   │   ├── lib/
│   │   │   ├── utils.js
│   │   │   └── countries.js
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
├── supabase/                    # Supabase config
│   └── migrations/
│
└── README.md
```

---

## Database Schema

### 1. User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String,
  lastName: String,
  phone: String,
  role: Enum ['admin', 'accountant', 'viewer'],
  company: ObjectId (ref: Company),
  subscription: ObjectId (ref: Subscription),
  isActive: Boolean,
  emailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date
}
```

### 2. Company Model
```javascript
{
  name: String (required),
  legalName: String,
  registrationNumber: String,
  taxId: String,
  vatNumber: String,
  email: String (required),
  phone: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String (required)
  },
  baseCurrency: {
    code: String (default: 'USD'),
    symbol: String (default: '$'),
    name: String
  },
  supportedCurrencies: [{
    code: String,
    symbol: String,
    name: String,
    isActive: Boolean
  }],
  timezone: String (default: 'UTC'),
  dateFormat: String,
  industry: Enum,
  businessType: Enum,
  owner: ObjectId (ref: User, required),
  members: [{
    user: ObjectId,
    role: Enum ['admin', 'manager', 'accountant', 'viewer'],
    joinedAt: Date
  }],
  isActive: Boolean,
  createdAt: Date
}
```

### 3. Subscription Model
```javascript
{
  user: ObjectId (ref: User, required),
  company: ObjectId (ref: Company),
  plan: Enum ['free', 'starter', 'professional', 'enterprise'],
  planDetails: {
    name: String,
    price: Number,
    currency: String,
    billingCycle: Enum ['monthly', 'annual'],
    features: [String],
    limits: {
      transactions: Number,
      invoices: Number,
      users: Number,
      storage: Number,
      aiRequests: Number
    }
  },
  status: Enum ['active', 'trialing', 'past_due', 'canceled'],
  currentPeriod: {
    start: Date,
    end: Date
  },
  usage: {
    transactions: Number,
    invoices: Number,
    aiRequests: Number,
    storageUsed: Number
  },
  createdAt: Date
}
```

### 4. Transaction Model
```javascript
{
  transactionId: String (unique, required),
  type: Enum ['income', 'expense', 'transfer', 'refund', 'adjustment'],
  amount: {
    value: Number (required),
    currency: {
      code: String,
      symbol: String
    }
  },
  exchangeRate: {
    rate: Number,
    baseCurrency: String,
    targetCurrency: String,
    convertedAmount: Number,
    rateDate: Date
  },
  category: String (required),
  aiCategorization: {
    suggestedCategory: String,
    confidence: Number,
    isConfirmed: Boolean
  },
  description: String (required),
  counterparty: {
    name: String,
    email: String,
    phone: String,
    address: Object
  },
  transactionDate: Date (required),
  status: Enum ['pending', 'cleared', 'reconciled', 'void', 'disputed'],
  tax: {
    isTaxable: Boolean,
    taxRate: Number,
    taxAmount: Number,
    taxCode: String
  },
  company: ObjectId (ref: Company, required),
  createdBy: ObjectId (ref: User, required),
  createdAt: Date
}
```

---

## API Routes

### Company Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/company | Create company | ✓ |
| GET | /api/company | Get user's company | ✓ |
| PUT | /api/company/:id | Update company | ✓ |
| POST | /api/company/:id/members | Add member | ✓ |
| DELETE | /api/company/:id/members/:userId | Remove member | ✓ |
| PUT | /api/company/:id/settings | Update settings | ✓ |

### Subscription Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/subscription | Get subscription | ✓ |
| GET | /api/subscription/plans | Get available plans | ✓ |
| POST | /api/subscription/upgrade | Upgrade plan | ✓ |
| POST | /api/subscription/cancel | Cancel subscription | ✓ |
| GET | /api/subscription/usage | Get usage stats | ✓ |
| POST | /api/subscription/trial | Start trial | ✓ |

### Forex Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/forex/rates | Get all rates | ✓ |
| GET | /api/forex/convert | Convert amount | ✓ |
| GET | /api/forex/currencies | Get supported currencies | ✓ |
| POST | /api/forex/format | Format amount | ✓ |

### Transaction Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/transactions | List transactions | ✓ |
| POST | /api/transactions | Create transaction | ✓ |
| GET | /api/transactions/:id | Get transaction | ✓ |
| PUT | /api/transactions/:id | Update transaction | ✓ |
| DELETE | /api/transactions/:id | Delete transaction | ✓ |
| GET | /api/transactions/summary | Get summary | ✓ |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# - MONGODB_URI
# - JWT_SECRET
# - EXCHANGE_RATE_API_KEY

# Start server
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Edit .env:
# - VITE_API_URL=http://localhost:5000/api

# Start dev server
npm run dev
```

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/2k_accounting

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Exchange Rate API
EXCHANGE_RATE_API_KEY=your_api_key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=2K AI Accounting
```

---

## Features

### ✅ Implemented
- **Multi-Currency Support**: Real-time exchange rates, automatic conversion
- **Company Management**: Full CRUD, multi-member support
- **Subscription System**: 4-tier plans (Free, Starter, Professional, Enterprise)
- **Transaction Management**: Multi-currency transactions with exchange rates
- **AI-Ready Structure**: Designed for future AI categorization
- **Security**: JWT auth, input validation, secure headers
- **Responsive UI**: Works on desktop, tablet, and mobile

### 🔄 In Progress
- AI-powered receipt scanning
- Automated bank sync
- Advanced reporting
- Payroll management

### 📋 Roadmap
- Mobile app (React Native)
- API access for Enterprise
- Multi-company support
- Advanced analytics dashboard
- AI financial forecasting

---

## Currency Support

### African Currencies (Priority)
- 🇺🇬 UGX - Ugandan Shilling
- 🇰🇪 KES - Kenyan Shilling  
- 🇹🇿 TZS - Tanzanian Shilling
- 🇷🇼 RWF - Rwandan Franc
- 🇳🇬 NGN - Nigerian Naira
- 🇬🇭 GHS - Ghanaian Cedi
- 🇿🇦 ZAR - South African Rand
- 🇿🇲 ZMW - Zambian Kwacha

### International Currencies
- 🇺🇸 USD - US Dollar
- 🇪🇺 EUR - Euro
- 🇬🇧 GBP - British Pound
- 🇯🇵 JPY - Japanese Yen
- 🇨🇳 CNY - Chinese Yuan

---

## License

MIT License - See LICENSE file

## Support

- Email: support@2kaiaccounting.com
- Documentation: https://docs.2kaiaccounting.com
- GitHub Issues: https://github.com/your-repo/issues

---

Built with ❤️ for African businesses
