const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Company reference (for business transactions)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },

  // Transaction details
  type: {
    type: String,
    required: true,
    enum: [
      'subscription_payment',
      'ai_credit_purchase',
      'transaction_fee',
      'refund',
      'chargeback',
      'upgrade_payment',
      'plan_change'
    ]
  },

  subtype: {
    type: String,
    enum: [
      'mtn_momo',
      'airtel_money',
      'card_payment',
      'bank_transfer',
      'cash',
      'other'
    ]
  },

  // Amount information (UGX)
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    default: 'UGX'
  },
  
  // Payment method details
  paymentMethod: {
    type: String,
    required: true,
    enum: ['mtn_momo', 'airtel_money', 'card', 'bank_transfer', 'cash', 'other']
  },

  paymentDetails: {
    phoneNumber: {
      type: String,
      required: function() {
        return ['mtn_momo', 'airtel_money'].includes(this.paymentMethod);
      }
    },
    transactionId: String,
    reference: String,
    authorizationCode: String,
    cardLast4: String,
    bankAccount: String,
    bankName: String,
    receiptNumber: String
  },

  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },

  // Timestamps
  initiatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  completedAt: {
    type: Date
  },
  
  failedAt: {
    type: Date
  },
  
  refundedAt: {
    type: Date
  },

  // Related entities
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },

  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },

  // Description and metadata
  description: {
    type: String,
    required: true
  },

  metadata: {
    // For subscription payments
    plan: String,
    billingCycle: String,
    period: {
      start: Date,
      end: Date
    },
    
    // For AI credit purchases
    creditsPurchased: Number,
    creditPrice: Number,
    
    // For transaction fees
    originalAmount: Number,
    feePercentage: Number,
    feeAmount: Number,
    
    // For refunds
    originalTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    refundReason: String,
    
    // Webhook data
    webhookData: mongoose.Schema.Types.Mixed,
    
    // Uganda-specific
    paymentProvider: {
      type: String,
      enum: ['flutterwave', 'mtn_momo_direct', 'airtel_money_direct', 'stripe', 'manual'],
      default: 'flutterwave'
    },
    
    // Mobile money specific
    momoTransactionId: String,
    momoReference: String,
    momoStatus: String,
    
    // Fraud detection
    ipAddress: String,
    userAgent: String,
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // Retry information
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    nextRetryAt: Date
  },

  // Error information
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
    providerResponse: mongoose.Schema.Types.Mixed
  },

  // Admin notes
  adminNotes: String,
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ 'paymentDetails.phoneNumber': 1 });
transactionSchema.index({ 'paymentDetails.transactionId': 1 });
transactionSchema.index({ 'paymentDetails.reference': 1 });
transactionSchema.index({ initiatedAt: -1 });
transactionSchema.index({ completedAt: -1 });
transactionSchema.index({ subscription: 1 });
transactionSchema.index({ 'metadata.riskScore': 1 });

// Virtual fields
transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

transactionSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

transactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

transactionSchema.virtual('processingTime').get(function() {
  if (this.completedAt && this.initiatedAt) {
    return this.completedAt - this.initiatedAt;
  }
  return null;
});

transactionSchema.virtual('canRetry').get(function() {
  return this.isFailed && this.retryCount < this.maxRetries;
});

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Set timestamps based on status
  const now = new Date();
  
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = now;
    } else if (this.status === 'failed' && !this.failedAt) {
      this.failedAt = now;
    } else if (this.status === 'refunded' && !this.refundedAt) {
      this.refundedAt = now;
    }
  }
  
  // Calculate next retry time for failed transactions
  if (this.isFailed && this.canRetry && !this.nextRetryAt) {
    const retryDelay = Math.pow(2, this.retryCount) * 60 * 1000; // Exponential backoff
    this.nextRetryAt = new Date(Date.now() + retryDelay);
  }
  
  next();
});

// Static methods
transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.initiatedAt = {};
    if (options.dateFrom) {
      query.initiatedAt.$gte = options.dateFrom;
    }
    if (options.dateTo) {
      query.initiatedAt.$lte = options.dateTo;
    }
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

transactionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' });
};

transactionSchema.statics.findFailed = function() {
  return this.find({ status: 'failed' });
};

transactionSchema.statics.findRetryable = function() {
  return this.find({
    status: 'failed',
    retryCount: { $lt: 3 },
    nextRetryAt: { $lte: new Date() }
  });
};

transactionSchema.statics.getRevenueStats = function(dateFrom, dateTo) {
  const matchStage = {
    status: 'completed',
    initiatedAt: {}
  };
  
  if (dateFrom) {
    matchStage.initiatedAt.$gte = dateFrom;
  }
  if (dateTo) {
    matchStage.initiatedAt.$lte = dateTo;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageTransactionValue: { $avg: '$amount' },
        revenueByType: {
          $push: {
            type: '$type',
            amount: '$amount'
          }
        },
        revenueByMethod: {
          $push: {
            method: '$paymentMethod',
            amount: '$amount'
          }
        }
      }
    }
  ]);
};

transactionSchema.statics.getUserSpending = function(userId, period = 'month') {
  const now = new Date();
  let dateFrom;
  
  switch (period) {
    case 'day':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      dateFrom = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case 'month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      dateFrom = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      dateFrom = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  }
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        status: 'completed',
        initiatedAt: { $gte: dateFrom }
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageSpent: { $avg: '$amount' }
      }
    }
  ]);
};

// Instance methods
transactionSchema.methods.markCompleted = async function(completedAt = null) {
  this.status = 'completed';
  this.completedAt = completedAt || new Date();
  return this.save();
};

transactionSchema.methods.markFailed = async function(error = null) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.retryCount += 1;
  
  if (error) {
    this.error = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error.details || {}
    };
  }
  
  return this.save();
};

transactionSchema.methods.retry = async function() {
  if (!this.canRetry) {
    throw new Error('Transaction cannot be retried');
  }
  
  this.status = 'pending';
  this.error = undefined;
  return this.save();
};

transactionSchema.methods.refund = async function(reason = '') {
  if (this.status !== 'completed') {
    throw new Error('Only completed transactions can be refunded');
  }
  
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.metadata.refundReason = reason;
  
  return this.save();
};

transactionSchema.methods.calculateFee = function(feePercentage = 0, fixedFee = 0) {
  const feeAmount = (this.amount * feePercentage) + fixedFee;
  const netAmount = this.amount - feeAmount;
  
  return {
    grossAmount: this.amount,
    feePercentage,
    fixedFee,
    feeAmount,
    netAmount
  };
};

transactionSchema.methods.updateRiskScore = function(score) {
  this.metadata.riskScore = Math.min(100, Math.max(0, score));
  return this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);
