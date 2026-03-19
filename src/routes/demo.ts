import { Router } from 'express';
import { body, query } from 'express-validator';
import { createBooking, getAvailableSlots, getBookings, getBookingById, updateBookingStatus, deleteBooking, getBookingStats, rescheduleBooking } from '../controllers/demoController';
import { isAdmin } from '../middleware/isAdmin';
import { demoLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/demo/book
 * @desc    Create a new demo booking
 * @access  Public
 */
router.post(
  '/book',
  demoLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('company')
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Company name must be between 2 and 200 characters'),
    body('preferredDate')
      .notEmpty()
      .withMessage('Preferred date is required')
      .isISO8601()
      .withMessage('Please enter a valid date')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (date <= now) {
          throw new Error('Preferred date must be in the future');
        }
        return true;
      }),
    body('preferredTime')
      .notEmpty()
      .withMessage('Preferred time is required')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Time must be in HH:MM format (24-hour)'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[+]?[\d\s\-\(\)]+$/)
      .withMessage('Please enter a valid phone number')
      .isLength({ max: 20 })
      .withMessage('Phone number cannot exceed 20 characters'),
    body('website')
      .optional()
      .trim()
      .isURL()
      .withMessage('Please enter a valid website URL')
      .isLength({ max: 255 })
      .withMessage('Website URL cannot exceed 255 characters'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),
    body('timezone')
      .optional()
      .isIn(['UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'IST', 'JST', 'AEST'])
      .withMessage('Invalid timezone'),
    body('source')
      .optional()
      .isIn(['website', 'referral', 'social', 'search', 'other'])
      .withMessage('Invalid source')
  ],
  createBooking
);

/**
 * @route   GET /api/demo/available-slots
 * @desc    Get available time slots for a specific date
 * @access  Public
 */
router.get(
  '/available-slots',
  [
    query('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Please enter a valid date')
  ],
  getAvailableSlots
);

/**
 * @route   GET /api/demo/admin/bookings
 * @desc    Get all demo bookings (admin only)
 * @access  Admin
 */
router.get(
  '/admin/bookings',
  isAdmin,
  getBookings
);

/**
 * @route   GET /api/demo/admin/bookings/:id
 * @desc    Get booking by ID (admin only)
 * @access  Admin
 */
router.get(
  '/admin/bookings/:id',
  isAdmin,
  getBookingById
);

/**
 * @route   PUT /api/demo/admin/bookings/:id/status
 * @desc    Update booking status (admin only)
 * @access  Admin
 */
router.put(
  '/admin/bookings/:id/status',
  isAdmin,
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
      .withMessage('Invalid status'),
    body('adminNotes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Admin notes cannot exceed 1000 characters'),
    body('assignedTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid assigned user ID'),
    body('meetingLink')
      .optional()
      .trim()
      .isURL()
      .withMessage('Please enter a valid meeting link URL'),
    body('meetingPlatform')
      .optional()
      .isIn(['zoom', 'google_meet', 'microsoft_teams', 'phone', 'in_person'])
      .withMessage('Invalid meeting platform')
  ],
  updateBookingStatus
);

/**
 * @route   PUT /api/demo/admin/bookings/:id/reschedule
 * @desc    Reschedule booking (admin only)
 * @access  Admin
 */
router.put(
  '/admin/bookings/:id/reschedule',
  isAdmin,
  [
    body('newDate')
      .notEmpty()
      .withMessage('New date is required')
      .isISO8601()
      .withMessage('Please enter a valid date')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (date <= now) {
          throw new Error('New date must be in the future');
        }
        return true;
      }),
    body('newTime')
      .notEmpty()
      .withMessage('New time is required')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Time must be in HH:MM format (24-hour)'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],
  rescheduleBooking
);

/**
 * @route   DELETE /api/demo/admin/bookings/:id
 * @desc    Delete booking (admin only)
 * @access  Admin
 */
router.delete(
  '/admin/bookings/:id',
  isAdmin,
  deleteBooking
);

/**
 * @route   GET /api/demo/admin/stats
 * @desc    Get demo booking statistics (admin only)
 * @access  Admin
 */
router.get(
  '/admin/stats',
  isAdmin,
  getBookingStats
);

export default router;
