const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

/**
 * Subscription Routes
 * Base path: /api/subscription
 */

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/subscription
 * @desc    Get current subscription
 * @access  Private
 */
router.get('/', subscriptionController.getSubscription);

/**
 * @route   GET /api/subscription/plans
 * @desc    Get available plans with pricing
 * @access  Private
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @route   POST /api/subscription/upgrade
 * @desc    Upgrade subscription plan
 * @access  Private
 */
router.post(
  '/upgrade',
  [
    body('plan')
      .notEmpty()
      .withMessage('Plan is required')
      .isIn(['starter', 'professional', 'enterprise'])
      .withMessage('Invalid plan'),
    body('billingCycle')
      .optional()
      .isIn(['monthly', 'annual'])
      .withMessage('Invalid billing cycle'),
    body('paymentProvider')
      .optional()
      .isIn(['stripe', 'flutterwave', 'paystack', 'pesapal', 'demo'])
      .withMessage('Invalid payment provider')
  ],
  subscriptionController.upgrade
);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post(
  '/cancel',
  [
    body('reason')
      .optional()
      .isString(),
    body('immediate')
      .optional()
      .isBoolean()
  ],
  subscriptionController.cancel
);

/**
 * @route   GET /api/subscription/usage
 * @desc    Get usage statistics
 * @access  Private
 */
router.get('/usage', subscriptionController.getUsage);

/**
 * @route   POST /api/subscription/trial
 * @desc    Start trial period
 * @access  Private
 */
router.post(
  '/trial',
  [
    body('days')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Trial days must be between 1 and 30')
  ],
  subscriptionController.startTrial
);

module.exports = router;
