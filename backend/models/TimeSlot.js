const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  // Time slot details
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  },
  duration: {
    type: Number,
    default: 30, // minutes
    enum: [15, 30, 45, 60]
  },

  // Availability
  isAvailable: {
    type: Boolean,
    default: true
  },
  maxBookings: {
    type: Number,
    default: 1
  },
  currentBookings: {
    type: Number,
    default: 0
  },

  // Configuration
  timezone: {
    type: String,
    default: 'UTC',
    enum: ['UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'IST', 'JST', 'AEST']
  },

  // Business rules
  isWeekend: {
    type: Boolean,
    default: false
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  bufferTime: {
    type: Number, // minutes
    default: 15
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique time slots
timeSlotSchema.index({ date: 1, time: 1 }, { unique: true });
timeSlotSchema.index({ date: 1, isAvailable: 1 });

// Virtual for full datetime
timeSlotSchema.virtual('fullDateTime').get(function() {
  const date = this.date.toISOString().split('T')[0];
  return `${date}T${this.time}:00.000Z`;
});

// Virtual for availability percentage
timeSlotSchema.virtual('availabilityPercentage').get(function() {
  if (this.maxBookings === 0) return 0;
  return ((this.maxBookings - this.currentBookings) / this.maxBookings) * 100;
});

// Static methods
timeSlotSchema.statics.generateDailySlots = async function(date, options = {}) {
  const {
    startHour = 9,
    endHour = 17,
    duration = 30,
    interval = 30,
    excludeWeekends = true,
    maxBookings = 1
  } = options;

  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  
  // Skip weekends if configured
  if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return [];
  }

  const slots = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      slots.push({
        date: targetDate,
        time: timeString,
        duration,
        maxBookings,
        currentBookings: 0,
        isAvailable: true
      });
    }
  }

  // Insert slots with upsert to avoid duplicates
  const operations = slots.map(slot => ({
    updateOne: {
      filter: { date: slot.date, time: slot.time },
      update: { $setOnInsert: slot },
      upsert: true
    }
  }));

  await this.bulkWrite(operations);
  
  return slots;
};

timeSlotSchema.statics.getAvailableSlots = async function(date, filters = {}) {
  const {
    timezone = 'UTC',
    duration = 30
  } = filters;

  const slots = await this.find({
    date: new Date(date),
    isAvailable: true,
    duration,
    $expr: { $lt: ['$currentBookings', '$maxBookings'] }
  }).sort({ time: 1 });

  return slots;
};

timeSlotSchema.statics.blockSlot = async function(date, time, reason) {
  const slot = await this.findOneAndUpdate(
    { date: new Date(date), time },
    { 
      isAvailable: false,
      notes: reason || 'Blocked manually'
    },
    { new: true }
  );

  return slot;
};

timeSlotSchema.statics.releaseSlot = async function(date, time) {
  const slot = await this.findOneAndUpdate(
    { date: new Date(date), time },
    { 
      isAvailable: true,
      notes: ''
    },
    { new: true }
  );

  return slot;
};

// Instance methods
timeSlotSchema.methods.book = async function() {
  if (!this.isAvailable || this.currentBookings >= this.maxBookings) {
    throw new Error('Time slot is not available');
  }

  this.currentBookings += 1;
  
  if (this.currentBookings >= this.maxBookings) {
    this.isAvailable = false;
  }

  return await this.save();
};

timeSlotSchema.methods.release = async function() {
  if (this.currentBookings > 0) {
    this.currentBookings -= 1;
    
    if (this.currentBookings < this.maxBookings) {
      this.isAvailable = true;
    }
  }

  return await this.save();
};

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
