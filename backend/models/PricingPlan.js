const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  // Plan identification
  name: {
    type: String,
    required: true,
    enum: ['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE'],
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },

  // Pricing details (UGX)
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  yearlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  yearlyDiscount: {
    type: Number,
    default: 0.2 // 20% discount for yearly
  },

  // Feature limits
  limits: {
    maxTransactions: {
      type: Number,
      required: true,
      min: -1 // -1 for unlimited
    },
    maxUsers: {
      type: Number,
      default: 1
    },
    maxReports: {
      type: Number,
      default: 10
    },
    aiFeatures: {
      type: Boolean,
      default: false
    },
    mobileMoneyTracking: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    crmIntegration: {
      type: Boolean,
      default: false
    },
    customDashboards: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    emailSupport: {
      type: Boolean,
      default: false
    },
    phoneSupport: {
      type: Boolean,
      default: false
    },
    dedicatedManager: {
      type: Boolean,
      default: false
    }
  },

  // AI credits system
  aiCredits: {
    monthlyCredits: {
      type: Number,
      default: 0
    },
    creditPrice: {
      type: Number,
      default: 500 // UGX per credit
    }
  },

  // Transaction fees
  transactionFees: {
    enabled: {
      type: Boolean,
      default: false
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 0.05 // Max 5%
    },
    fixedFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Plan metadata
  features: [{
    name: String,
    included: Boolean,
    description: String
  }],
  
  popular: {
    type: Boolean,
    default: false
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },

  // Uganda-specific settings
  ugandaMarket: {
    targetAudience: {
      type: String,
      enum: ['individual', 'small_business', 'medium_business', 'enterprise'],
      default: 'small_business'
    },
    localCurrency: {
      type: String,
      default: 'UGX'
    },
    paymentMethods: [{
      type: String,
      enum: ['mtn_momo', 'airtel_money', 'card', 'bank_transfer']
    }]
  }
}, {
  timestamps: true
});

// Indexes
pricingPlanSchema.index({ name: 1 });
pricingPlanSchema.index({ isActive: 1 });
pricingPlanSchema.index({ sortOrder: 1 });

// Static methods
pricingPlanSchema.statics.getAvailablePlans = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

pricingPlanSchema.statics.getPlanByName = function(name) {
  return this.findOne({ name, isActive: true });
};

pricingPlanSchema.statics.calculatePrice = function(planName, billingCycle = 'monthly') {
  return this.findOne({ name: planName, isActive: true })
    .then(plan => {
      if (!plan) throw new Error('Plan not found');
      
      if (billingCycle === 'yearly') {
        return plan.yearlyPrice;
      }
      return plan.monthlyPrice;
    });
};

// Instance methods
pricingPlanSchema.methods.canAccessFeature = function(feature) {
  return this.limits[feature] || false;
};

pricingPlanSchema.methods.isWithinLimit = function(feature, currentUsage) {
  const limit = this.limits[feature];
  if (limit === -1) return true; // Unlimited
  return currentUsage <= limit;
};

pricingPlanSchema.methods.getYearlySavings = function() {
  const yearlyMonthlyCost = this.monthlyPrice * 12;
  return Math.round((yearlyMonthlyCost - this.yearlyPrice) / yearlyMonthlyCost * 100);
};

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);
