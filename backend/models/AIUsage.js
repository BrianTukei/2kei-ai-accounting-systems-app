const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
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

  // Request details
  requestType: {
    type: String,
    required: true,
    enum: [
      'financial_analysis',
      'expense_categorization',
      'revenue_prediction',
      'fraud_detection',
      'cash_flow_forecast',
      'profit_optimization',
      'tax_optimization',
      'budget_analysis',
      'invoice_processing',
      'receipt_scanning',
      'report_generation',
      'insight_generation',
      'recommendation',
      'chat_query',
      'data_export',
      'api_call'
    ]
  },

  subType: {
    type: String,
    enum: [
      'basic', 'advanced', 'premium', 'realtime', 'batch', 'interactive'
    ]
  },

  // Credits consumed
  creditsUsed: {
    type: Number,
    required: true,
    min: 0
  },

  // Cost information (UGX)
  costPerCredit: {
    type: Number,
    required: true,
    default: 500 // 500 UGX per credit
  },

  totalCost: {
    type: Number,
    required: true,
    min: 0
  },

  // Request metadata
  requestData: {
    input: String,
    parameters: mongoose.Schema.Types.Mixed,
    context: mongoose.Schema.Types.Mixed,
    sessionId: String,
    requestId: String
  },

  // Response metadata
  responseData: {
    output: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processingTime: Number,
    tokensUsed: {
      input: Number,
      output: Number,
      total: Number
    },
    model: String,
    version: String
  },

  // Quality metrics
  quality: {
    accuracy: {
      type: Number,
      min: 0,
      max: 1
    },
    relevance: {
      type: Number,
      min: 0,
      max: 1
    },
    completeness: {
      type: Number,
      min: 0,
      max: 1
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userFeedback: String
  },

  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ['initiated', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'initiated'
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

  // Error information
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
    stack: String
  },

  // Performance metrics
  performance: {
    requestSize: Number,
    responseSize: Number,
    latency: Number,
    throughput: Number,
    cacheHit: Boolean
  },

  // Usage analytics
  analytics: {
    sessionId: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'integration', 'automated'],
      default: 'web'
    },
    feature: String,
    module: String,
    action: String,
    userAgent: String,
    ipAddress: String,
    geolocation: {
      country: String,
      city: String,
      region: String
    }
  },

  // Business context
  businessContext: {
    industry: String,
    companySize: String,
    revenueRange: String,
    useCase: String,
    department: String
  },

  // Cost optimization
  optimization: {
    cached: Boolean,
    batchProcessed: Boolean,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    queueTime: Number,
    processingQueue: String
  },

  // Compliance and audit
  audit: {
    complianceChecked: Boolean,
    dataPrivacy: Boolean,
    gdprCompliant: Boolean,
    auditTrail: String
  },

  // Uganda-specific
  ugandaContext: {
    localCurrency: {
      type: String,
      default: 'UGX'
    },
    localRegulations: Boolean,
    taxRelevant: Boolean,
    businessRegistration: String
  },

  // Admin notes
  adminNotes: String,
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String
}, {
  timestamps: true
});

// Indexes
aiUsageSchema.index({ user: 1, createdAt: -1 });
aiUsageSchema.index({ status: 1 });
aiUsageSchema.index({ requestType: 1 });
aiUsageSchema.index({ initiatedAt: -1 });
aiUsageSchema.index({ completedAt: -1 });
aiUsageSchema.index({ creditsUsed: 1 });
aiUsageSchema.index({ totalCost: 1 });
aiUsageSchema.index({ 'analytics.sessionId': 1 });
aiUsageSchema.index({ flagged: 1 });

// Compound indexes
aiUsageSchema.index({ user: 1, requestType: 1, createdAt: -1 });
aiUsageSchema.index({ user: 1, status: 1 });
aiUsageSchema.index({ company: 1, createdAt: -1 });

// Virtual fields
aiUsageSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

aiUsageSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

aiUsageSchema.virtual('processingTime').get(function() {
  if (this.completedAt && this.initiatedAt) {
    return this.completedAt - this.initiatedAt;
  }
  return null;
});

aiUsageSchema.virtual('efficiency').get(function() {
  if (this.creditsUsed > 0 && this.responseData?.confidence) {
    return this.responseData.confidence / this.creditsUsed;
  }
  return 0;
});

// Pre-save middleware
aiUsageSchema.pre('save', function(next) {
  // Calculate total cost
  this.totalCost = this.creditsUsed * this.costPerCredit;
  
  // Set timestamps based on status
  const now = new Date();
  
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = now;
    } else if (this.status === 'failed' && !this.failedAt) {
      this.failedAt = now;
    }
  }
  
  // Auto-flag unusual usage
  if (this.creditsUsed > 100 || this.totalCost > 50000) {
    this.flagged = true;
    this.flagReason = 'High resource usage';
  }
  
  next();
});

// Static methods
aiUsageSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.requestType) {
    query.requestType = options.requestType;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.createdAt = {};
    if (options.dateFrom) {
      query.createdAt.$gte = options.dateFrom;
    }
    if (options.dateTo) {
      query.createdAt.$lte = options.dateTo;
    }
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

aiUsageSchema.statics.getUserUsageStats = function(userId, period = 'month') {
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
        createdAt: { $gte: dateFrom }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalCredits: { $sum: '$creditsUsed' },
        totalCost: { $sum: '$totalCost' },
        averageCreditsPerRequest: { $avg: '$creditsUsed' },
        averageCostPerRequest: { $avg: '$totalCost' },
        requestsByType: {
          $push: {
            type: '$requestType',
            credits: '$creditsUsed'
          }
        },
        averageConfidence: { $avg: '$responseData.confidence' },
        averageProcessingTime: { $avg: '$performance.latency' }
      }
    }
  ]);
};

aiUsageSchema.statics.getUsageByType = function(dateFrom, dateTo) {
  const matchStage = {
    status: 'completed',
    createdAt: {}
  };
  
  if (dateFrom) {
    matchStage.createdAt.$gte = dateFrom;
  }
  if (dateTo) {
    matchStage.createdAt.$lte = dateTo;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$requestType',
        totalRequests: { $sum: 1 },
        totalCredits: { $sum: '$creditsUsed' },
        totalCost: { $sum: '$totalCost' },
        averageCreditsPerRequest: { $avg: '$creditsUsed' },
        averageConfidence: { $avg: '$responseData.confidence' }
      }
    },
    { $sort: { totalCost: -1 } }
  ]);
};

aiUsageSchema.statics.getRevenueFromAI = function(dateFrom, dateTo) {
  const matchStage = {
    status: 'completed',
    createdAt: {}
  };
  
  if (dateFrom) {
    matchStage.createdAt.$gte = dateFrom;
  }
  if (dateTo) {
    matchStage.createdAt.$lte = dateTo;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalCost' },
        totalCredits: { $sum: '$creditsUsed' },
        totalRequests: { $sum: 1 },
        averageRevenuePerRequest: { $avg: '$totalCost' },
        revenueByType: {
          $push: {
            type: '$requestType',
            revenue: '$totalCost'
          }
        }
      }
    }
  ]);
};

aiUsageSchema.statics.getTopUsers = function(limit = 10, period = 'month') {
  const now = new Date();
  let dateFrom;
  
  switch (period) {
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
        status: 'completed',
        createdAt: { $gte: dateFrom }
      }
    },
    {
      $group: {
        _id: '$user',
        totalRequests: { $sum: 1 },
        totalCredits: { $sum: '$creditsUsed' },
        totalCost: { $sum: '$totalCost' },
        averageCreditsPerRequest: { $avg: '$creditsUsed' }
      }
    },
    { $sort: { totalCost: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ]);
};

aiUsageSchema.statics.getFlaggedUsage = function() {
  return this.find({ flagged: true })
    .sort({ createdAt: -1 })
    .populate('user', 'name email');
};

// Instance methods
aiUsageSchema.methods.markCompleted = async function(responseData = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  
  if (responseData) {
    this.responseData = { ...this.responseData, ...responseData };
  }
  
  return this.save();
};

aiUsageSchema.methods.markFailed = async function(error = null) {
  this.status = 'failed';
  this.failedAt = new Date();
  
  if (error) {
    this.error = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error.details || {}
    };
  }
  
  return this.save();
};

aiUsageSchema.methods.rate = async function(rating, feedback = '') {
  this.quality.userRating = rating;
  this.quality.userFeedback = feedback;
  return this.save();
};

aiUsageSchema.methods.flag = async function(reason) {
  this.flagged = true;
  this.flagReason = reason;
  return this.save();
};

aiUsageSchema.methods.calculateEfficiency = function() {
  if (this.creditsUsed === 0) return 0;
  
  let score = 0;
  
  // Confidence score (40% weight)
  if (this.responseData?.confidence) {
    score += this.responseData.confidence * 0.4;
  }
  
  // Processing time efficiency (30% weight)
  if (this.performance?.latency) {
    // Lower latency = higher score
    const latencyScore = Math.max(0, 1 - (this.performance.latency / 10000)); // 10s as max
    score += latencyScore * 0.3;
  }
  
  // Credit efficiency (30% weight)
  if (this.creditsUsed <= 5) {
    score += 0.3;
  } else if (this.creditsUsed <= 10) {
    score += 0.2;
  } else if (this.creditsUsed <= 20) {
    score += 0.1;
  }
  
  return Math.min(1, score);
};

module.exports = mongoose.model('AIUsage', aiUsageSchema);
