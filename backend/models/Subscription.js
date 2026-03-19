const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Plan details
  plan: {
    type: String,
    required: true,
    enum: ['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE'],
    default: 'FREE'
  },
  
  // Billing cycle
  billingCycle: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },

  // Subscription dates
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  nextBillingDate: {
    type: Date,
    required: true
  },

  // Status management
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'suspended', 'trial'],
    default: 'active'
  },

  // Grace period
  gracePeriodEnds: {
    type: Date
  },
  
  inGracePeriod: {
    type: Boolean,
    default: false
  },

  // Payment information
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    default: 'UGX'
  },

  // Auto-renewal settings
  autoRenew: {
    type: Boolean,
    default: true
  },

  // Cancellation information
  cancelledAt: {
    type: Date
  },
  
  cancelReason: {
    type: String
  },
  
  cancellationEffectiveDate: {
    type: Date
  },

  // Payment method
  paymentMethod: {
    type: String,
    enum: ['mtn_momo', 'airtel_money', 'card', 'bank_transfer', 'manual'],
    required: true
  },

  paymentDetails: {
    phoneNumber: String,
    cardLast4: String,
    bankAccount: String,
    transactionReference: String
  },

  // Usage tracking
  currentUsage: {
    transactions: {
      type: Number,
      default: 0
    },
    aiCredits: {
      type: Number,
      default: 0
    },
    users: {
      type: Number,
      default: 1
    },
    reports: {
      type: Number,
      default: 0
    }
  },

  // Usage limits (from pricing plan)
  limits: {
    maxTransactions: {
      type: Number,
      default: 50
    },
    maxUsers: {
      type: Number,
      default: 1
    },
    maxReports: {
      type: Number,
      default: 10
    },
    aiCredits: {
      type: Number,
      default: 0
    }
  },

  // AI Credits system
  aiCredits: {
    total: {
      type: Number,
      default: 0
    },
    used: {
      type: Number,
      default: 0
    },
    available: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Billing history
  billingHistory: [{
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      default: 'UGX'
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      required: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    transactionId: String,
    invoiceId: String,
    description: String
  }],

  // Upgrade/Downgrade tracking
  planChanges: [{
    fromPlan: String,
    toPlan: String,
    changeDate: {
      type: Date,
      default: Date.now
    },
    reason: String,
    initiatedBy: {
      type: String,
      enum: ['user', 'admin', 'system']
    }
  }],

  // Notifications
  notifications: {
    lastPaymentReminder: Date,
    lastExpiryWarning: Date,
    lastGracePeriodWarning: Date,
    paymentFailedCount: {
      type: Number,
      default: 0
    }
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['website', 'mobile_app', 'admin', 'api'],
      default: 'website'
    },
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    referralCode: String
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ 'aiCredits.available': 1 });

// Virtual fields
subscriptionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.endDate > now && 
         (!this.inGracePeriod || this.gracePeriodEnds > now);
});

subscriptionSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

subscriptionSchema.virtual('isInTrial').get(function() {
  return this.status === 'trial';
});

subscriptionSchema.virtual('needsPayment').get(function() {
  const now = new Date();
  return this.nextBillingDate <= now && this.autoRenew;
});

subscriptionSchema.virtual('usagePercentage').get(function() {
  const limits = this.limits;
  const usage = this.currentUsage;
  
  const percentages = {};
  for (const key in limits) {
    if (limits[key] > 0) {
      percentages[key] = Math.min((usage[key] / limits[key]) * 100, 100);
    } else {
      percentages[key] = 0;
    }
  }
  
  return percentages;
});

// Pre-save middleware
subscriptionSchema.pre('save', function(next) {
  // Update available credits
  this.aiCredits.available = this.aiCredits.total - this.aiCredits.used;
  
  // Update grace period status
  const now = new Date();
  if (this.endDate <= now && this.status === 'active' && !this.inGracePeriod) {
    this.inGracePeriod = true;
    this.gracePeriodEnds = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)); // 5 days
  }
  
  // Check if grace period has ended
  if (this.inGracePeriod && this.gracePeriodEnds <= now) {
    this.status = 'expired';
    this.inGracePeriod = false;
  }
  
  next();
});

// Static methods
subscriptionSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId }).populate('user');
};

subscriptionSchema.statics.findActiveSubscriptions = function() {
  return this.find({ 
    status: 'active',
    endDate: { $gt: new Date() }
  });
};

subscriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $lte: futureDate, $gt: new Date() },
    autoRenew: true
  });
};

subscriptionSchema.statics.findOverduePayments = function() {
  return this.find({
    nextBillingDate: { $lte: new Date() },
    status: 'active',
    autoRenew: true
  });
};

// Instance methods
subscriptionSchema.methods.upgradePlan = async function(newPlan, billingCycle = 'monthly') {
  const oldPlan = this.plan;
  this.plan = newPlan;
  this.billingCycle = billingCycle;
  this.planChanges.push({
    fromPlan: oldPlan,
    toPlan: newPlan,
    changeDate: new Date(),
    initiatedBy: 'user'
  });
  
  // Update billing dates
  this.nextBillingDate = new Date();
  this.endDate = new Date();
  
  if (billingCycle === 'yearly') {
    this.endDate.setFullYear(this.endDate.getFullYear() + 1);
  } else {
    this.endDate.setMonth(this.endDate.getMonth() + 1);
  }
  
  return this.save();
};

subscriptionSchema.methods.downgradePlan = async function(newPlan, effectiveDate = null) {
  const oldPlan = this.plan;
  this.plan = newPlan;
  this.planChanges.push({
    fromPlan: oldPlan,
    toPlan: newPlan,
    changeDate: new Date(),
    reason: 'User requested downgrade',
    initiatedBy: 'user'
  });
  
  if (effectiveDate) {
    this.cancellationEffectiveDate = effectiveDate;
  }
  
  return this.save();
};

subscriptionSchema.methods.cancel = async function(reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  this.autoRenew = false;
  
  // Keep active until end of billing period
  this.cancellationEffectiveDate = this.endDate;
  
  return this.save();
};

subscriptionSchema.methods.addAICredits = async function(credits, description = '') {
  this.aiCredits.total += credits;
  this.aiCredits.available += credits;
  this.aiCredits.lastUpdated = new Date();
  
  // Add to billing history if paid
  if (description && description.includes('purchase')) {
    this.billingHistory.push({
      date: new Date(),
      amount: credits * 500, // 500 UGX per credit
      currency: 'UGX',
      status: 'paid',
      paymentMethod: this.paymentMethod,
      description: `AI Credits Purchase: ${credits} credits`
    });
  }
  
  return this.save();
};

subscriptionSchema.methods.useAICredits = async function(credits) {
  if (this.aiCredits.available < credits) {
    throw new Error('Insufficient AI credits');
  }
  
  this.aiCredits.used += credits;
  this.aiCredits.available -= credits;
  this.aiCredits.lastUpdated = new Date();
  
  return this.save();
};

subscriptionSchema.methods.checkUsageLimit = function(feature, currentUsage = null) {
  const usage = currentUsage !== null ? currentUsage : this.currentUsage[feature];
  const limit = this.limits[feature];
  
  if (limit === -1) return { allowed: true, remaining: 'unlimited' };
  
  const remaining = Math.max(0, limit - usage);
  const percentageUsed = (usage / limit) * 100;
  
  return {
    allowed: usage < limit,
    remaining,
    percentageUsed,
    limit,
    currentUsage: usage
  };
};

subscriptionSchema.methods.extendSubscription = async function(billingCycle = 'monthly') {
  const now = new Date();
  const newEndDate = new Date(this.endDate);
  
  if (billingCycle === 'yearly') {
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
  } else {
    newEndDate.setMonth(newEndDate.getMonth() + 1);
  }
  
  this.endDate = newEndDate;
  this.nextBillingDate = newEndDate;
  this.status = 'active';
  this.inGracePeriod = false;
  this.gracePeriodEnds = null;
  
  // Add to billing history
  this.billingHistory.push({
    date: now,
    amount: this.price,
    currency: this.currency,
    status: 'paid',
    paymentMethod: this.paymentMethod,
    description: `Subscription renewal - ${this.plan} (${billingCycle})`
  });
  
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
