const mongoose = require('mongoose');

const demoBookingSchema = new mongoose.Schema({
  // Contact Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [255, 'Website URL cannot exceed 255 characters']
  },

  // Booking Details
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
    validate: {
      validator: function(value) {
        return value > new Date(); // Must be future date
      },
      message: 'Preferred date must be in the future'
    }
  },
  preferredTime: {
    type: String,
    required: [true, 'Preferred time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  },
  timezone: {
    type: String,
    default: 'UTC',
    enum: ['UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'IST', 'JST', 'AEST']
  },

  // Additional Information
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social', 'search', 'other'],
    default: 'website'
  },

  // Status and Tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Meeting Details
  meetingLink: {
    type: String,
    trim: true
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'google_meet', 'microsoft_teams', 'phone', 'in_person'],
    default: 'zoom'
  },
  duration: {
    type: Number,
    default: 30, // minutes
    enum: [15, 30, 45, 60]
  },

  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Reminders and Follow-ups
  remindersSent: [{
    type: Date
  }],
  followUpDate: {
    type: Date
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
demoBookingSchema.index({ email: 1 });
demoBookingSchema.index({ preferredDate: 1 });
demoBookingSchema.index({ status: 1 });
demoBookingSchema.index({ createdAt: -1 });
demoBookingSchema.index({ preferredDate: 1, preferredTime: 1 });

// Virtual for formatted date/time
demoBookingSchema.virtual('formattedDateTime').get(function() {
  const date = this.preferredDate;
  const time = this.preferredTime;
  return `${date.toISOString().split('T')[0]} at ${time}`;
});

// Virtual for booking age
demoBookingSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Pre-save middleware
demoBookingSchema.pre('save', function(next) {
  // Check for double bookings
  if (this.isNew || this.isModified('preferredDate') || this.isModified('preferredTime')) {
    this.constructor.findOne({
      preferredDate: this.preferredDate,
      preferredTime: this.preferredTime,
      status: { $in: ['pending', 'confirmed'] }
    }).then(existing => {
      if (existing) {
        const error = new Error('This time slot is already booked');
        error.code = 'SLOT_TAKEN';
        return next(error);
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Static methods
demoBookingSchema.statics.getAvailableSlots = async function(date) {
  const bookedSlots = await this.find({
    preferredDate: new Date(date),
    status: { $in: ['pending', 'confirmed'] }
  }).select('preferredTime');

  const allSlots = generateTimeSlots();
  return allSlots.filter(slot => 
    !bookedSlots.some(booking => booking.preferredTime === slot.time)
  );
};

demoBookingSchema.statics.getBookingStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        latest: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const total = await this.countDocuments();
  const thisMonth = await this.countDocuments({
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  });

  return {
    total,
    thisMonth,
    byStatus: stats,
    conversionRate: total > 0 ? (stats.find(s => s._id === 'confirmed')?.count || 0) / total * 100 : 0
  };
};

// Helper function to generate time slots
function generateTimeSlots() {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({ time: `${hour.toString().padStart(2, '0')}:00`, label: `${hour}:00 AM` });
    slots.push({ time: `${hour.toString().padStart(2, '0')}:30`, label: `${hour}:30 AM` });
  }
  
  return slots;
}

module.exports = mongoose.model('DemoBooking', demoBookingSchema);
