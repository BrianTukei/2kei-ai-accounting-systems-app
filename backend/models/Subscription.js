const mongoose = require('mongoose');

/**
 * Subscription Schema
 * - Tracks user subscription plans and billing
 * - Supports multiple plans: free, starter, professional, enterprise
 * - Integrates with payment providers (Stripe, Flutterwave, etc.)
 */
const subscriptionSchema = new mongoose.Schema({
  // Reference to user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Company reference
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },

  // Plan Details
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  },
  
  planDetails: {
    name: String,
    price: Number,
    currency: { type: String, default: 'USD' },
    billingCycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
    features: [String],
    limits: {
      transactions: { type: Number, default: 100 },
      invoices: { type: Number, default: 10 },
      users: { type: Number, default: 1 },
      storage: { type: Number, default: 1 }, // GB
      aiRequests: { type: Number, default: 50 }
    }
  },

  // Billing Information
  billingInfo: {
    provider: {
      type: String,
      enum: ['stripe', 'flutterwave', 'paystack', 'pesapal', 'manual'],
      default: 'manual'
    },
    customerId: String, // Payment provider customer ID
    subscriptionId: String, // Payment provider subscription ID
    paymentMethod: {
      type: { type: String },
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number
    }
  },

  // Trial Status
  trial: {
    isActive: { type: Boolean, default: false },
    startedAt: Date,
    endsAt: Date,
    daysRemaining: { type: Number, default: 0 }
  },

  // Subscription Period
  currentPeriod: {
    start: Date,
    end: Date
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'],
    default: 'active'
  },

  // Cancellation
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },

  // Payment History
  payments: [{
    id: String,
    amount: Number,
    currency: String,
    status: { type: String, enum: ['succeeded', 'pending', 'failed'] },
    provider: String,
    providerPaymentId: String,
    paidAt: Date,
    receiptUrl: String
  }],

  // Usage Tracking
  usage: {
    transactions: { type: Number, default: 0 },
    invoices: { type: Number, default: 0 },
    aiRequests: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 } // MB
  },

  // Invoice Settings
  invoiceSettings: {
    autoGenerate: { type: Boolean, default: true },
    sendEmail: { type: Boolean, default: true },
    billingEmail: String
  },

  // Grace Period
  gracePeriod: {
    isActive: { type: Boolean, default: false },
    startedAt: Date,
    endsAt: Date
  },

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
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ 'currentPeriod.end': 1 });

// Virtual: Is in trial
subscriptionSchema.virtual('isTrialing').get(function() {
  if (!this.trial.isActive || !this.trial.endsAt) return false;
  return new Date() < this.trial.endsAt;
});

// Virtual: Is expired
subscriptionSchema.virtual('isExpired').get(function() {
  if (this.status === 'active' || this.status === 'trialing') return false;
  if (!this.currentPeriod.end) return true;
  return new Date() > this.currentPeriod.end;
});

// Virtual: Days until renewal
subscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (!this.currentPeriod.end) return 0;
  const diff = this.currentPeriod.end - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method: Check if feature is available
subscriptionSchema.methods.hasFeature = function(featureName) {
  const planFeatures = {
    free: ['basic_accounting', 'invoices', 'reports'],
    starter: ['basic_accounting', 'invoices', 'reports', 'multi_currency', 'bank_sync'],
    professional: ['basic_accounting', 'invoices', 'reports', 'multi_currency', 'bank_sync', 'payroll', 'inventory', 'ai_assistant'],
    enterprise: ['all_features', 'api_access', 'dedicated_support', 'custom_integrations']
  };
  
  const features = planFeatures[this.plan] || planFeatures.free;
  return features.includes(featureName) || features.includes('all_features');
};

// Method: Check if within limits
subscriptionSchema.methods.isWithinLimit = function(limitType, currentValue) {
  const limit = this.planDetails?.limits?.[limitType];
  if (!limit) return true; // No limit set
  return currentValue < limit;
};

// Method: Increment usage
subscriptionSchema.methods.incrementUsage = async function(type, amount = 1) {
  if (this.usage[type] !== undefined) {
    this.usage[type] += amount;
    await this.save();
  }
};

// Method: Can upgrade
subscriptionSchema.methods.canUpgrade = function(targetPlan) {
  const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
  return planHierarchy[targetPlan] > planHierarchy[this.plan];
};

// Static: Get plan pricing
subscriptionSchema.statics.getPlanPricing = function() {
  return {
    free: {
      name: 'Free',
      monthly: 0,
      annual: 0,
      features: ['Basic accounting', 'Up to 100 transactions', 'Up to 10 invoices', 'Email support']
    },
    starter: {
      name: 'Starter',
      monthly: 19,
      annual: 190,
      features: ['Everything in Free', 'Unlimited transactions', 'Unlimited invoices', 'Multi-currency', 'Bank sync', 'Priority support']
    },
    professional: {
      name: 'Professional',
      monthly: 49,
      annual: 490,
      features: ['Everything in Starter', 'Payroll', 'Inventory', 'AI Assistant', 'Advanced reports', '5 team members']
    },
    enterprise: {
      name: 'Enterprise',
      monthly: 99,
      annual: 990,
      features: ['Everything in Professional', 'Unlimited team members', 'API access', 'Dedicated support', 'Custom integrations']
    }
  };
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
