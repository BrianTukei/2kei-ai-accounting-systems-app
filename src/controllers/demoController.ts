import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { sendDemoConfirmation, sendDemoNotification, sendBookingStatusUpdate, sendRescheduleNotification } from '../services/demoService';
import { logger } from '../utils/logger';

// Mock database - replace with actual MongoDB models
interface DemoBooking {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  website?: string;
  preferredDate: Date;
  preferredTime: string;
  timezone: string;
  message?: string;
  source: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  priority: 'low' | 'medium' | 'high';
  meetingLink?: string;
  meetingPlatform: 'zoom' | 'google_meet' | 'microsoft_teams' | 'phone' | 'in_person';
  duration: number;
  adminNotes?: string;
  assignedTo?: string;
  ipAddress?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeSlot {
  _id: string;
  date: Date;
  time: string;
  duration: number;
  isAvailable: boolean;
  maxBookings: number;
  currentBookings: number;
  timezone: string;
}

// Mock data - replace with actual database operations
let demoBookings: DemoBooking[] = [];
let timeSlots: TimeSlot[] = [];

/**
 * Create a new demo booking
 */
export const createBooking = async (req: Request, res: Response) => {
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
      timezone = 'UTC',
      source = 'website'
    } = req.body;

    // Check if time slot is available
    const existingBooking = demoBookings.find(
      booking => 
        booking.preferredDate.toISOString().split('T')[0] === new Date(preferredDate).toISOString().split('T')[0] &&
        booking.preferredTime === preferredTime &&
        ['pending', 'confirmed'].includes(booking.status)
    );

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please select a different time.'
      });
    }

    // Create booking
    const booking: DemoBooking = {
      _id: uuidv4(),
      name,
      email,
      company,
      phone,
      website,
      preferredDate: new Date(preferredDate),
      preferredTime,
      timezone,
      message,
      source,
      status: 'pending',
      priority: 'medium',
      meetingPlatform: 'zoom',
      duration: 30,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      utmSource: req.query.utm_source as string,
      utmMedium: req.query.utm_medium as string,
      utmCampaign: req.query.utm_campaign as string,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    demoBookings.push(booking);

    // Update time slot
    const timeSlot = timeSlots.find(
      slot => 
        slot.date.toISOString().split('T')[0] === new Date(preferredDate).toISOString().split('T')[0] &&
        slot.time === preferredTime
    );

    if (timeSlot) {
      timeSlot.currentBookings += 1;
      if (timeSlot.currentBookings >= timeSlot.maxBookings) {
        timeSlot.isAvailable = false;
      }
    } else {
      // Create new time slot
      timeSlots.push({
        _id: uuidv4(),
        date: new Date(preferredDate),
        time: preferredTime,
        duration: 30,
        isAvailable: false,
        maxBookings: 1,
        currentBookings: 1,
        timezone
      });
    }

    // Send confirmation email to user
    try {
      await sendDemoConfirmation(booking);
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    // Send notification email to admin
    try {
      await sendDemoNotification(booking);
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
    logger.error('Failed to create demo booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking. Please try again.'
    });
  }
};

/**
 * Get available time slots for a date
 */
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { date, timezone = 'UTC', duration = 30 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    // Generate time slots for the date
    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.json({
        success: true,
        data: { availableSlots: [] }
      });
    }

    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    const interval = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if slot is already booked
        const existingSlot = timeSlots.find(
          slot => 
            slot.date.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0] &&
            slot.time === timeString
        );

        if (!existingSlot) {
          slots.push({
            _id: uuidv4(),
            date: targetDate,
            time: timeString,
            duration: parseInt(duration as string),
            isAvailable: true,
            maxBookings: 1,
            currentBookings: 0,
            timezone: timezone as string
          });
        } else if (existingSlot.isAvailable && existingSlot.currentBookings < existingSlot.maxBookings) {
          slots.push(existingSlot);
        }
      }
    }

    res.json({
      success: true,
      data: { availableSlots: slots }
    });
  } catch (error) {
    logger.error('Failed to fetch available slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots'
    });
  }
};

/**
 * Get all demo bookings (admin only)
 */
export const getBookings = async (req: Request, res: Response) => {
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

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Build query
    let filteredBookings = demoBookings;
    
    if (status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }
    
    if (date) {
      const targetDate = new Date(date as string);
      filteredBookings = filteredBookings.filter(booking => {
        const bookingDate = new Date(booking.preferredDate);
        return bookingDate.toDateString() === targetDate.toDateString();
      });
    }
    
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredBookings = filteredBookings.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm) ||
        booking.email.toLowerCase().includes(searchTerm) ||
        booking.company.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    filteredBookings.sort((a, b) => {
      const aValue = a[sortBy as keyof DemoBooking];
      const bValue = b[sortBy as keyof DemoBooking];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    const total = filteredBookings.length;
    const bookings = filteredBookings.slice(skip, skip + parseInt(limit as string));

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
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
};

/**
 * Get booking by ID (admin only)
 */
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const booking = demoBookings.find(b => b._id === id);
    
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
};

/**
 * Update booking status (admin only)
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignedTo, meetingLink, meetingPlatform } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const bookingIndex = demoBookings.findIndex(b => b._id === id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = demoBookings[bookingIndex];
    booking.status = status;
    booking.adminNotes = adminNotes;
    booking.assignedTo = assignedTo;
    booking.meetingLink = meetingLink;
    booking.meetingPlatform = meetingPlatform;
    booking.updatedAt = new Date();

    // Send status update email to user
    try {
      await sendBookingStatusUpdate(booking);
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
};

/**
 * Delete booking (admin only)
 */
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const bookingIndex = demoBookings.findIndex(b => b._id === id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = demoBookings[bookingIndex];
    
    // Release time slot
    const timeSlot = timeSlots.find(
      slot => 
        slot.date.toISOString().split('T')[0] === booking.preferredDate.toISOString().split('T')[0] &&
        slot.time === booking.preferredTime
    );

    if (timeSlot) {
      timeSlot.currentBookings -= 1;
      if (timeSlot.currentBookings < timeSlot.maxBookings) {
        timeSlot.isAvailable = true;
      }
    }

    demoBookings.splice(bookingIndex, 1);

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
};

/**
 * Get booking statistics (admin only)
 */
export const getBookingStats = async (req: Request, res: Response) => {
  try {
    const stats = {
      total: demoBookings.length,
      thisMonth: demoBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        const now = new Date();
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      }).length,
      byStatus: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].map(status => ({
        _id: status,
        count: demoBookings.filter(b => b.status === status).length
      })),
      conversionRate: demoBookings.length > 0 ? 
        (demoBookings.filter(b => b.status === 'confirmed').length / demoBookings.length) * 100 : 0
    };

    const recentBookings = demoBookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(({ name, company, email, preferredDate, preferredTime, status, createdAt }) => ({
        name,
        company,
        email,
        preferredDate,
        preferredTime,
        status,
        createdAt
      }));

    const upcomingBookings = demoBookings
      .filter(booking => 
        new Date(booking.preferredDate) >= new Date() && 
        ['pending', 'confirmed'].includes(booking.status)
      )
      .sort((a, b) => new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime())
      .slice(0, 5);

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
};

/**
 * Reschedule booking
 */
export const rescheduleBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;

    const bookingIndex = demoBookings.findIndex(b => b._id === id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = demoBookings[bookingIndex];

    // Check if new time slot is available
    const existingBooking = demoBookings.find(
      b => 
        b._id !== id &&
        b.preferredDate.toISOString().split('T')[0] === new Date(newDate).toISOString().split('T')[0] &&
        b.preferredTime === newTime &&
        ['pending', 'confirmed'].includes(b.status)
    );

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked'
      });
    }

    // Release old time slot
    const oldTimeSlot = timeSlots.find(
      slot => 
        slot.date.toISOString().split('T')[0] === booking.preferredDate.toISOString().split('T')[0] &&
        slot.time === booking.preferredTime
    );

    if (oldTimeSlot) {
      oldTimeSlot.currentBookings -= 1;
      if (oldTimeSlot.currentBookings < oldTimeSlot.maxBookings) {
        oldTimeSlot.isAvailable = true;
      }
    }

    // Book new time slot
    const newTimeSlot = timeSlots.find(
      slot => 
        slot.date.toISOString().split('T')[0] === new Date(newDate).toISOString().split('T')[0] &&
        slot.time === newTime
    );

    if (newTimeSlot) {
      newTimeSlot.currentBookings += 1;
      if (newTimeSlot.currentBookings >= newTimeSlot.maxBookings) {
        newTimeSlot.isAvailable = false;
      }
    } else {
      timeSlots.push({
        _id: uuidv4(),
        date: new Date(newDate),
        time: newTime,
        duration: 30,
        isAvailable: false,
        maxBookings: 1,
        currentBookings: 1,
        timezone: booking.timezone
      });
    }

    // Update booking
    const oldDateTime = `${booking.preferredDate.toISOString().split('T')[0]} at ${booking.preferredTime}`;
    
    booking.preferredDate = new Date(newDate);
    booking.preferredTime = newTime;
    booking.adminNotes = `Rescheduled from ${oldDateTime}. Reason: ${reason || 'Requested by customer'}`;
    booking.updatedAt = new Date();

    // Send reschedule notification
    try {
      await sendRescheduleNotification(booking, oldDateTime);
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
};
