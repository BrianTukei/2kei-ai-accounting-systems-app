const DemoBooking = require('../models/DemoBooking');
const TimeSlot = require('../models/TimeSlot');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class DemoController {
  /**
   * Create a new demo booking
   */
  async createBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        name,
        email,
        company,
        phone,
        website,
        preferredDate,
        preferredTime,
        message,
        timezone,
        source
      } = req.body;

      // 🔴 Check 1: Prevent duplicate bookings for same email (duplicate user protection)
      const existingUserBooking = await DemoBooking.findOne({
        email: email.toLowerCase(),
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingUserBooking) {
        return res.status(409).json({
          success: false,
          error: `You already have a demo scheduled for ${new Date(existingUserBooking.preferredDate).toLocaleDateString()} at ${existingUserBooking.preferredTime}. Please contact us if you need to reschedule.`
        });
      }

      // 🔴 Check 2: Prevent booking same time slot twice (slot collision)
      const existingSlotBooking = await DemoBooking.findOne({
        preferredDate: new Date(preferredDate),
        preferredTime,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingSlotBooking) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked. Please select a different time.'
        });
      }

      // Step 7: Add Default Company Fallback (Demo Safety)
      const Company = require('../models/Company');
      let companyId;
      const defaultCompany = await Company.findOne().select('_id name');
      
      if (defaultCompany) {
        companyId = defaultCompany._id;
      }

      // Step 6 & 10: Mandatory Validation Before Booking & Error instead of silent failure
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'No company assigned to this user (or system demo data missing).'
        });
      }

      // Create booking
      const booking = new DemoBooking({
        name,
        email,
        company: company || defaultCompany.name, // Keep the string for UI if needed
        companyId, // Link the actual relationship
        phone,
        website,
        preferredDate: new Date(preferredDate),
        preferredTime,
        message,
        timezone: timezone || 'UTC',
        source: source || 'website',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        utmSource: req.query.utm_source,
        utmMedium: req.query.utm_medium,
        utmCampaign: req.query.utm_campaign
      });

      await booking.save();

      // Update time slot
      await TimeSlot.findOneAndUpdate(
        { date: new Date(preferredDate), time: preferredTime },
        { $inc: { currentBookings: 1 } }
      ).catch(() => {
        // Time slot might not exist, create it
        return TimeSlot.create({
          date: new Date(preferredDate),
          time: preferredTime,
          currentBookings: 1,
          maxBookings: 1,
          isAvailable: false
        });
      });

      // Send confirmation email to user
      try {
        await emailService.sendDemoBookingNotification(booking);
      } catch (emailError) {
        logger.error('Failed to send booking confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      // Send notification email to admin (if needed)
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@2kaccounting.com';
        await emailService.sendEmail(
          adminEmail,
          'New Demo Booking Received',
          `<p>New demo booking from ${booking.name} (${booking.email})</p>
           <p>Preferred Date: ${booking.preferredDate}</p>
           <p>Preferred Time: ${booking.preferredTime}</p>`
        );
      } catch (emailError) {
        logger.error('Failed to send admin notification:', emailError);
        // Don't fail the booking if email fails
      }

      res.status(201).json({
        success: true,
        data: {
          booking: {
            id: booking._id,
            name: booking.name,
            email: booking.email,
            company: booking.company,
            preferredDate: booking.preferredDate,
            preferredTime: booking.preferredTime,
            status: booking.status,
            createdAt: booking.createdAt
          }
        },
        message: 'Demo booking created successfully! Check your email for confirmation.'
      });
    } catch (error) {
      logger.error('Failed to create demo booking:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        requestData: {
          name: req.body.name,
          email: req.body.email,
          company: req.body.company,
          preferredDate: req.body.preferredDate,
          preferredTime: req.body.preferredTime
        }
      });
      
      if (error.code === 'SLOT_TAKEN') {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked. Please select a different time.'
        });
      }

      // Return detailed error in development
      const isDev = process.env.NODE_ENV !== 'production';
      res.status(500).json({
        success: false,
        error: isDev ? error.message : 'Failed to create booking. Please try again.',
        details: isDev ? error.stack : undefined
      });
    }
  }

  /**
   * Get all demo bookings (admin only)
   */
  async getBookings(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status = '',
        date = '',
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build query
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1);
        query.preferredDate = {
          $gte: startOfDay,
          $lt: endOfDay
        };
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [bookings, total] = await Promise.all([
        DemoBooking.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        DemoBooking.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Failed to fetch demo bookings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings'
      });
    }
  }

  /**
   * Get booking by ID (admin only)
   */
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      
      const booking = await DemoBooking.findById(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      res.json({
        success: true,
        data: { booking }
      });
    } catch (error) {
      logger.error('Failed to fetch booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch booking'
      });
    }
  }

  /**
   * Update booking status (admin only)
   */
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes, assignedTo, meetingLink, meetingPlatform } = req.body;

      if (!['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      const booking = await DemoBooking.findByIdAndUpdate(
        id,
        {
          status,
          adminNotes,
          assignedTo,
          meetingLink,
          meetingPlatform,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      // Send status update email to user
      try {
        await emailService.sendBookingStatusUpdate(booking);
      } catch (emailError) {
        logger.error('Failed to send status update email:', emailError);
      }

      res.json({
        success: true,
        data: { booking },
        message: `Booking status updated to ${status}`
      });
    } catch (error) {
      logger.error('Failed to update booking status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update booking status'
      });
    }
  }

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(req, res) {
    try {
      const { date, timezone = 'UTC', duration = 30 } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Date is required'
        });
      }

      // Get available slots from TimeSlot model
      const availableSlots = await TimeSlot.getAvailableSlots(date, {
        timezone,
        duration: parseInt(duration)
      });

      // If no time slots exist for this date, generate them
      if (availableSlots.length === 0) {
        await TimeSlot.generateDailySlots(date, {
          duration: parseInt(duration),
          excludeWeekends: true
        });

        // Try again
        const slots = await TimeSlot.getAvailableSlots(date, {
          timezone,
          duration: parseInt(duration)
        });

        res.json({
          success: true,
          data: { availableSlots: slots }
        });
      } else {
        res.json({
          success: true,
          data: { availableSlots }
        });
      }
    } catch (error) {
      logger.error('Failed to fetch available slots:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available slots'
      });
    }
  }

  /**
   * Get booking statistics (admin only)
   */
  async getBookingStats(req, res) {
    try {
      const stats = await DemoBooking.getBookingStats();
      
      // Additional analytics
      const recentBookings = await DemoBooking.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name company email preferredDate preferredTime status createdAt')
        .lean();

      const upcomingBookings = await DemoBooking.find({
        preferredDate: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      })
      .sort({ preferredDate: 1, preferredTime: 1 })
      .limit(5)
      .lean();

      res.json({
        success: true,
        data: {
          stats,
          recentBookings,
          upcomingBookings
        }
      });
    } catch (error) {
      logger.error('Failed to fetch booking stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch booking statistics'
      });
    }
  }

  /**
   * Delete booking (admin only)
   */
  async deleteBooking(req, res) {
    try {
      const { id } = req.params;
      
      const booking = await DemoBooking.findByIdAndDelete(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      // Release time slot
      await TimeSlot.findOneAndUpdate(
        { date: booking.preferredDate, time: booking.preferredTime },
        { $inc: { currentBookings: -1 }, $set: { isAvailable: true } }
      ).catch(() => {
        // Time slot might not exist, ignore error
      });

      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete booking'
      });
    }
  }

  /**
   * Reschedule booking
   */
  async rescheduleBooking(req, res) {
    try {
      const { id } = req.params;
      const { newDate, newTime, reason } = req.body;

      const booking = await DemoBooking.findById(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      // Check if new time slot is available
      const existingBooking = await DemoBooking.findOne({
        _id: { $ne: id },
        preferredDate: new Date(newDate),
        preferredTime: newTime,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked'
        });
      }

      // Release old time slot
      await TimeSlot.findOneAndUpdate(
        { date: booking.preferredDate, time: booking.preferredTime },
        { $inc: { currentBookings: -1 }, $set: { isAvailable: true } }
      ).catch(() => {});

      // Book new time slot
      await TimeSlot.findOneAndUpdate(
        { date: new Date(newDate), time: newTime },
        { $inc: { currentBookings: 1 }, $set: { isAvailable: false } }
      ).catch(() => {});

      // Update booking
      const oldDateTime = `${booking.preferredDate.toISOString().split('T')[0]} at ${booking.preferredTime}`;
      
      booking.preferredDate = new Date(newDate);
      booking.preferredTime = newTime;
      booking.adminNotes = `Rescheduled from ${oldDateTime}. Reason: ${reason || 'Requested by customer'}`;
      
      await booking.save();

      // Send reschedule notification
      try {
        await emailService.sendRescheduleNotification(booking, oldDateTime);
      } catch (emailError) {
        logger.error('Failed to send reschedule email:', emailError);
      }

      res.json({
        success: true,
        data: { booking },
        message: 'Booking rescheduled successfully'
      });
    } catch (error) {
      logger.error('Failed to reschedule booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reschedule booking'
      });
    }
  }
}

module.exports = new DemoController();
