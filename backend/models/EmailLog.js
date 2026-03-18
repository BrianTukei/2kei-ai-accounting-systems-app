const mongoose = require('mongoose');

/**
 * Email Logs Schema
 * Tracks all emails sent through the system for audit and debugging
 */
const emailLogSchema = new mongoose.Schema({
  // Email details
  messageId: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },

  // Sender information
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Recipient information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Email status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'],
    default: 'pending'
  },

  // Error information
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed
  },

  // Email metadata
  type: {
    type: String,
    enum: ['admin_message', 'welcome', 'payment_reminder', 'expiry_warning', 'bulk_campaign', 'transactional'],
    default: 'admin_message'
  },

  // Bulk email tracking
  bulkId: {
    type: String,
    index: true
  },

  // Delivery tracking
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,

  // Technical details
  provider: {
    type: String,
    default: 'nodemailer'
  },
  providerMessageId: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
emailLogSchema.index({ admin: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ type: 1, createdAt: -1 });
emailLogSchema.index({ bulkId: 1 });

// Virtual: Is successful
emailLogSchema.virtual('isSuccessful').get(function() {
  return ['sent', 'delivered', 'opened', 'clicked'].includes(this.status);
});

// Static: Get email statistics
emailLogSchema.statics.getStatistics = async function(filters = {}) {
  const match = { ...filters };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        latest: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static: Get admin email history
emailLogSchema.statics.getAdminHistory = async function(adminId, options = {}) {
  const { page = 1, limit = 20, status, type } = options;
  const skip = (page - 1) * limit;

  const query = { admin: adminId };
  if (status) query.status = status;
  if (type) query.type = type;

  const [emails, total] = await Promise.all([
    this.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    emails,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static: Get bulk email details
emailLogSchema.statics.getBulkEmailDetails = async function(bulkId) {
  const emails = await this.find({ bulkId })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: 1 })
    .lean();

  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    failed: emails.filter(e => e.status === 'failed').length,
    pending: emails.filter(e => e.status === 'pending').length
  };

  return {
    bulkId,
    emails,
    stats,
    createdAt: emails[0]?.createdAt
  };
};

module.exports = mongoose.model('EmailLog', emailLogSchema);
