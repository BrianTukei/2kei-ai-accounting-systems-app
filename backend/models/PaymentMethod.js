const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Company reference
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },

  // Payment method type
  type: {
    type: String,
    required: true,
    enum: ['mtn_momo', 'airtel_money', 'card', 'bank_transfer', 'cash', 'other']
  },

  // Mobile Money specific
  mobileMoney: {
    phoneNumber: {
      type: String,
      required: function() {
        return ['mtn_momo', 'airtel_money'].includes(this.type);
      },
      validate: {
        validator: function(v) {
          // Validate Ugandan phone numbers
          return /^(\+256|0)[7]\d{8}$/.test(v);
        },
        message: 'Please enter a valid Ugandan phone number'
      }
    },
    network: {
      type: String,
      enum: ['mtn', 'airtel'],
      required: function() {
        return ['mtn_momo', 'airtel_money'].includes(this.type);
      }
    },
    registeredName: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending'
    },
    verificationCode: String,
    verificationExpires: Date
  },

  // Card specific
  card: {
    last4: {
      type: String,
      required: function() {
        return this.type === 'card';
      },
      validate: {
        validator: function(v) {
          return /^\d{4}$/.test(v);
        },
        message: 'Card last4 must be 4 digits'
      }
    },
    brand: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover', 'jcb'],
      required: function() {
        return this.type === 'card';
      }
    },
    expiryMonth: {
      type: Number,
      min: 1,
      max: 12,
      required: function() {
        return this.type === 'card';
      }
    },
    expiryYear: {
      type: Number,
      min: new Date().getFullYear(),
      required: function() {
        return this.type === 'card';
      }
    },
    cardholderName: {
      type: String,
      required: function() {
        return this.type === 'card';
      }
    },
    fingerprint: String, // For tokenization
    token: String
  },

  // Bank transfer specific
  bankTransfer: {
    bankName: {
      type: String,
      required: function() {
        return this.type === 'bank_transfer';
      }
    },
    accountNumber: {
      type: String,
      required: function() {
        return this.type === 'bank_transfer';
      }
    },
    accountName: {
      type: String,
      required: function() {
        return this.type === 'bank_transfer';
      }
    },
    bankCode: String,
    branch: String
  },

  // Status and preferences
  isDefault: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Usage tracking
  usage: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    successRate: {
      type: Number,
      default: 100
    },
    failureCount: {
      type: Number,
      default: 0
    }
  },

  // Limits and restrictions
  limits: {
    dailyLimit: {
      type: Number,
      default: 1000000 // 1M UGX default
    },
    monthlyLimit: {
      type: Number,
      default: 10000000 // 10M UGX default
    },
    transactionLimit: {
      type: Number,
      default: 500000 // 500K UGX default
    }
  },

  // Provider integration
  provider: {
    name: {
      type: String,
      enum: ['flutterwave', 'mtn_momo_direct', 'airtel_money_direct', 'stripe', 'manual'],
      default: 'flutterwave'
    },
    externalId: String,
    metadata: mongoose.Schema.Types.Mixed
  },

  // Security and fraud detection
  security: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    verificationLevel: {
      type: String,
      enum: ['none', 'basic', 'enhanced', 'premium'],
      default: 'basic'
    },
    lastVerified: Date,
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    blocked: {
      type: Boolean,
      default: false
    },
    blockReason: String
  },

  // Uganda-specific fields
  ugandaContext: {
    region: {
      type: String,
      enum: ['central', 'eastern', 'northern', 'western'],
      default: 'central'
    },
    city: String,
    isLocalBank: {
      type: Boolean,
      default: false
    },
    supportsInstant: {
      type: Boolean,
      default: true
    }
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['user_input', 'api_import', 'admin_add', 'migration'],
      default: 'user_input'
    },
    description: String,
    tags: [String]
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
paymentMethodSchema.index({ user: 1, type: 1 });
paymentMethodSchema.index({ user: 1, isDefault: 1 });
paymentMethodSchema.index({ user: 1, isActive: 1 });
paymentMethodSchema.index({ type: 1 });
paymentMethodSchema.index({ 'mobileMoney.phoneNumber': 1 });
paymentMethodSchema.index({ 'security.riskScore': 1 });
paymentMethodSchema.index({ 'security.blocked': 1 });

// Virtual fields
paymentMethodSchema.virtual('isMobileMoney').get(function() {
  return ['mtn_momo', 'airtel_money'].includes(this.type);
});

paymentMethodSchema.virtual('isCard').get(function() {
  return this.type === 'card';
});

paymentMethodSchema.virtual('isExpired').get(function() {
  if (this.type !== 'card') return false;
  
  const now = new Date();
  const expiryDate = new Date(this.card.expiryYear, this.card.expiryMonth - 1, 1);
  return expiryDate < now;
});

paymentMethodSchema.virtual('maskedNumber').get(function() {
  if (this.isMobileMoney && this.mobileMoney.phoneNumber) {
    const phone = this.mobileMoney.phoneNumber;
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  }
  
  if (this.isCard && this.card.last4) {
    return `**** **** **** ${this.card.last4}`;
  }
  
  return null;
});

paymentMethodSchema.virtual('displayName').get(function() {
  switch (this.type) {
    case 'mtn_momo':
      return `MTN MoMo (${this.maskedNumber})`;
    case 'airtel_money':
      return `Airtel Money (${this.maskedNumber})`;
    case 'card':
      return `${this.card.brand.toUpperCase()} (${this.maskedNumber})`;
    case 'bank_transfer':
      return `${this.bankTransfer.bankName} (${this.bankTransfer.accountNumber.slice(-4)})`;
    default:
      return this.type;
  }
});

// Pre-save middleware
paymentMethodSchema.pre('save', async function(next) {
  try {
    // Ensure only one default payment method per user
    if (this.isDefault) {
      const result = await this.constructor.updateMany(
        { user: this.user, _id: { $ne: this._id } },
        { isDefault: false }
      );
      if (result.error) {
        console.error('Error updating default payment method:', result.error);
      }
    }
    
    // Auto-expire cards
    if (this.isExpired) {
      this.isActive = false;
    }
    
    next();
  } catch (error) {
    console.error('Pre-save middleware error:', error.message);
    next(error);
  }
});

// Static methods
paymentMethodSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId, isActive: true };
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort({ isDefault: -1, createdAt: -1 });
};

paymentMethodSchema.statics.findDefault = function(userId) {
  return this.findOne({ user: userId, isDefault: true, isActive: true });
};

paymentMethodSchema.statics.findMobileMoney = function(userId) {
  return this.find({
    user: userId,
    type: { $in: ['mtn_momo', 'airtel_money'] },
    isActive: true
  });
};

paymentMethodSchema.statics.verifyPhoneNumber = function(userId, phoneNumber, code) {
  return this.findOne({
    user: userId,
    'mobileMoney.phoneNumber': phoneNumber,
    'mobileMoney.verificationCode': code,
    'mobileMoney.verificationExpires': { $gt: new Date() }
  });
};

paymentMethodSchema.statics.getUsageStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalTransactions: { $sum: '$usage.totalTransactions' },
        totalAmount: { $sum: '$usage.totalAmount' },
        averageSuccessRate: { $avg: '$usage.successRate' }
      }
    }
  ]);
};

// Instance methods
paymentMethodSchema.methods.setDefault = async function() {
  await this.constructor.updateMany(
    { user: this.user, _id: { $ne: this._id } },
    { isDefault: false }
  );
  
  this.isDefault = true;
  return this.save();
};

paymentMethodSchema.methods.verify = async function() {
  if (this.isMobileMoney) {
    this.mobileMoney.verificationStatus = 'verified';
    this.mobileMoney.verificationCode = undefined;
    this.mobileMoney.verificationExpires = undefined;
    this.security.verificationLevel = 'enhanced';
    this.security.lastVerified = new Date();
  }
  
  return this.save();
};

paymentMethodSchema.methods.block = async function(reason) {
  this.isActive = false;
  this.security.blocked = true;
  this.security.blockReason = reason;
  return this.save();
};

paymentMethodSchema.methods.unblock = async function() {
  this.isActive = true;
  this.security.blocked = false;
  this.security.blockReason = undefined;
  return this.save();
};

paymentMethodSchema.methods.updateUsage = async function(amount, success = true) {
  this.usage.totalTransactions += 1;
  this.usage.totalAmount += amount;
  this.usage.lastUsed = new Date();
  
  if (success) {
    // Update success rate
    const totalTransactions = this.usage.totalTransactions;
    const failedTransactions = this.usage.failureCount;
    this.usage.successRate = ((totalTransactions - failedTransactions) / totalTransactions) * 100;
  } else {
    this.usage.failureCount += 1;
    this.usage.successRate = Math.max(0, this.usage.successRate - 5); // Penalty for failure
  }
  
  return this.save();
};

paymentMethodSchema.methods.checkLimit = function(amount) {
  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // This would require transaction history to check actual daily usage
  // For now, we'll use the stored limits as a basic check
  
  if (amount > this.limits.transactionLimit) {
    return {
      allowed: false,
      reason: 'Transaction amount exceeds limit',
      limit: this.limits.transactionLimit
    };
  }
  
  return {
    allowed: true,
    remainingDailyLimit: this.limits.dailyLimit,
    remainingMonthlyLimit: this.limits.monthlyLimit
  };
};

paymentMethodSchema.methods.generateVerificationCode = function() {
  if (!this.isMobileMoney) {
    throw new Error('Verification codes only available for mobile money');
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  this.mobileMoney.verificationCode = code;
  this.mobileMoney.verificationExpires = expires;
  
  try {
    await this.save();
    return code;
  } catch (error) {
    throw new Error(`Failed to generate verification code: ${error.message}`);
  }
};

paymentMethodSchema.methods.isVerificationCodeValid = function(code) {
  if (!this.isMobileMoney) return false;
  
  return this.mobileMoney.verificationCode === code &&
         this.mobileMoney.verificationExpires > new Date();
};

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
