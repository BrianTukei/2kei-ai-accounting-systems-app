const mongoose = require('mongoose');

/**
 * Transaction Schema
 * - Core accounting transactions (income, expenses, transfers)
 * - Multi-currency support with exchange rates
 * - AI-ready categorization and tagging
 */
const transactionSchema = new mongoose.Schema({
  // Transaction Info
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer', 'refund', 'adjustment'],
    required: true
  },

  // Amount & Currency
  amount: {
    value: {
      type: Number,
      required: true
    },
    currency: {
      code: { type: String, default: 'USD' },
      symbol: { type: String, default: '$' }
    }
  },
  
  // Exchange Rate (for multi-currency)
  exchangeRate: {
    rate: { type: Number, default: 1 },
    baseCurrency: { type: String, default: 'USD' },
    targetCurrency: { type: String, default: 'USD' },
    convertedAmount: { type: Number },
    rateDate: Date
  },

  // Category & Classification
  category: {
    type: String,
    required: true,
    enum: [
      // Income
      'sales', 'services', 'investment', 'interest', 'rental', 'refund', 'other_income',
      // Expenses
      'rent', 'utilities', 'salaries', 'marketing', 'office_supplies', 'software', 
      'travel', 'meals', 'insurance', 'taxes', 'professional_fees', 'equipment',
      'maintenance', 'inventory', 'shipping', 'bank_fees', 'other_expense',
      // Transfers
      'internal_transfer', 'loan_payment', 'investment_transfer'
    ]
  },
  
  subcategory: {
    type: String
  },

  // AI Categorization
  aiCategorization: {
    suggestedCategory: String,
    confidence: { type: Number, min: 0, max: 1 },
    isConfirmed: { type: Boolean, default: false }
  },

  // Accounts
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  
  transferAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },

  // Parties
  counterparty: {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },

  // Description & Notes
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Dates
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  
  valueDate: {
    type: Date
  },
  
  clearedDate: {
    type: Date
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'cleared', 'reconciled', 'void', 'disputed'],
    default: 'pending'
  },

  // Reconciliation
  reconciliation: {
    isReconciled: { type: Boolean, default: false },
    reconciledAt: Date,
    reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    statementDate: Date,
    statementBalance: Number
  },

  // Receipt & Attachments
  attachments: [{
    type: { type: String, enum: ['receipt', 'invoice', 'contract', 'other'] },
    name: String,
    url: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Receipt Scanning (AI)
  receiptData: {
    isScanned: { type: Boolean, default: false },
    scannedAt: Date,
    merchantName: String,
    merchantAddress: String,
    receiptNumber: String,
    taxAmount: Number,
    totalAmount: Number,
    items: [{
      name: String,
      quantity: Number,
      price: Number,
      total: Number
    }],
    ocrText: String,
    confidence: Number
  },

  // Tax Information
  tax: {
    isTaxable: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxCode: String
  },

  // Tags & Projects
  tags: [{
    type: String,
    trim: true
  }],
  
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  department: {
    type: String,
    trim: true
  },

  // Invoice Link
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },

  // Recurring Transaction
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
    nextDate: Date,
    endDate: Date,
    parentId: { type: mongoose.Schema.Types.ObjectId }
  },

  // AI Insights
  aiInsights: {
    anomalies: [{
      type: String,
      severity: { type: String, enum: ['low', 'medium', 'high'] },
      description: String
    }],
    patterns: [{
      type: String,
      confidence: Number
    }],
    forecast: {
      nextExpectedDate: Date,
      nextExpectedAmount: Number,
      probability: Number
    }
  },

  // Relationships
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Audit Trail
  auditLog: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedAt: { type: Date, default: Date.now },
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ company: 1, transactionDate: -1 });
transactionSchema.index({ company: 1, type: 1 });
transactionSchema.index({ company: 1, category: 1 });
transactionSchema.index({ company: 1, status: 1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ 'counterparty.name': 'text', description: 'text' });

// Virtual: Is cleared
transactionSchema.virtual('isCleared').get(function() {
  return this.status === 'cleared' || this.status === 'reconciled';
});

// Virtual: Net amount (after tax)
transactionSchema.virtual('netAmount').get(function() {
  return this.amount.value - (this.tax?.taxAmount || 0);
});

// Method: Get converted amount
transactionSchema.methods.getConvertedAmount = function(targetCurrency) {
  if (this.amount.currency.code === targetCurrency) {
    return this.amount.value;
  }
  if (this.exchangeRate && this.exchangeRate.targetCurrency === targetCurrency) {
    return this.exchangeRate.convertedAmount;
  }
  return null;
};

// Method: Mark as reconciled
transactionSchema.methods.markReconciled = async function(userId, statementDate, balance) {
  this.status = 'reconciled';
  this.reconciliation = {
    isReconciled: true,
    reconciledAt: new Date(),
    reconciledBy: userId,
    statementDate: statementDate,
    statementBalance: balance
  };
  await this.save();
};

// Static: Get transaction summary by period
transactionSchema.statics.getSummaryByPeriod = async function(companyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(companyId),
        transactionDate: { $gte: startDate, $lte: endDate },
        status: { $nin: ['void'] }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount.value' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static: Get category breakdown
transactionSchema.statics.getCategoryBreakdown = async function(companyId, type, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(companyId),
        type: type,
        transactionDate: { $gte: startDate, $lte: endDate },
        status: { $nin: ['void'] }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount.value' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
