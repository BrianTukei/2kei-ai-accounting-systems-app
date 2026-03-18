const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/adminAuth');

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require admin privileges
 */

// Apply admin middleware to all routes
router.use(isAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all registered users with pagination and filtering
 * @access  Admin
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @route   POST /api/admin/send-email
 * @desc    Send email to user(s)
 * @access  Admin
 */
router.post(
  '/send-email',
  [
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ max: 200 })
      .withMessage('Subject cannot exceed 200 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 10, max: 10000 })
      .withMessage('Message must be between 10 and 10,000 characters'),
    body('userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('emails')
      .optional()
      .isArray()
      .withMessage('Emails must be an array'),
    body('emails.*')
      .optional()
      .isEmail()
      .withMessage('Invalid email address'),
    body('type')
      .optional()
      .isIn(['admin_message', 'welcome', 'payment_reminder', 'expiry_warning', 'bulk_campaign'])
      .withMessage('Invalid email type')
  ],
  adminController.sendEmail
);

/**
 * @route   GET /api/admin/email-logs
 * @desc    Get admin email logs with pagination
 * @access  Admin
 */
router.get('/email-logs', adminController.getEmailLogs);

/**
 * @route   GET /api/admin/bulk-email/:bulkId
 * @desc    Get bulk email details and status
 * @access  Admin
 */
router.get('/bulk-email/:bulkId', adminController.getBulkEmailDetails);

/**
 * @route   GET /api/admin/email-stats
 * @desc    Get email statistics
 * @access  Admin
 */
router.get('/email-stats', adminController.getEmailStatistics);

/**
 * @route   POST /api/admin/test-email
 * @desc    Test email configuration
 * @access  Admin
 */
router.post('/test-email', adminController.testEmail);

module.exports = router;
