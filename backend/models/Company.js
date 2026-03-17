const mongoose = require('mongoose');

/**
 * Company Schema
 * - Stores business/organization details
 * - Linked to user (owner)
 * - Used in invoices, reports, and financial documents
 */
const companySchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  legalName: {
    type: String,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  vatNumber: {
    type: String,
    trim: true
  },

  // Contact Information
  email: {
    type: String,
    required: [true, 'Company email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },

  // Address
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { 
      type: String, 
      required: [true, 'Country is required'],
      trim: true
    }
  },

  // Currency & Financial Settings
  baseCurrency: {
    code: { type: String, default: 'USD' },
    symbol: { type: String, default: '$' },
    name: { type: String, default: 'US Dollar' }
  },
  supportedCurrencies: [{
    code: String,
    symbol: String,
    name: String,
    isActive: { type: Boolean, default: true }
  }],
  fiscalYearStart: {
    type: Number,
    min: 1,
    max: 12,
    default: 1
  },
  
  // Localization
  timezone: {
    type: String,
    default: 'UTC'
  },
  dateFormat: {
    type: String,
    enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'],
    default: 'MM/DD/YYYY'
  },
  numberFormat: {
    thousandSeparator: { type: String, default: ',' },
    decimalSeparator: { type: String, default: '.' },
    decimalPlaces: { type: Number, default: 2 }
  },

  // Industry & Business Type
  industry: {
    type: String,
    enum: ['retail', 'manufacturing', 'services', 'technology', 'healthcare', 'finance', 'education', 'other'],
    default: 'other'
  },
  businessType: {
    type: String,
    enum: ['sole_proprietorship', 'partnership', 'llc', 'corporation', 'nonprofit'],
    default: 'sole_proprietorship'
  },

  // Branding
  logo: {
    type: String // URL to logo image
  },
  brandColors: {
    primary: { type: String, default: '#3B82F6' },
    secondary: { type: String, default: '#10B981' }
  },

  // Relationships
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'manager', 'accountant', 'viewer'], default: 'viewer' },
    joinedAt: { type: Date, default: Date.now }
  }],

  // AI & Analytics Settings
  aiSettings: {
    autoCategorization: { type: Boolean, default: true },
    smartReminders: { type: Boolean, default: true },
    forecasting: { type: Boolean, default: false }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
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

// Index for faster queries
companySchema.index({ owner: 1 });
companySchema.index({ 'members.user': 1 });
companySchema.index({ isActive: 1 });

// Virtual for full address
companySchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

// Method to check if user is member
companySchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString()) ||
         this.owner.toString() === userId.toString();
};

// Method to get user's role in company
companySchema.methods.getUserRole = function(userId) {
  if (this.owner.toString() === userId.toString()) return 'admin';
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

module.exports = mongoose.model('Company', companySchema);
