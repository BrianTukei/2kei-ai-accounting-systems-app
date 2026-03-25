import express from 'express';
import { body, param, query } from 'express-validator';

// Import JavaScript controllers directly
const billingController = require('../controllers/billingController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Apply authentication to all billing routes
router.use(authMiddleware);

// Apply rate limiting to payment routes
const paymentLimiter = rateLimiter.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 payment attempts per 15 minutes
  message: 'Too many payment attempts, please try again later'
});

// Pricing Plans
router.get('/plans', billingController.getPricingPlans);

// Cost Calculation
router.post('/calculate-cost', [
  body('plan').isIn(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']).withMessage('Invalid plan'),
  body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
  body('discountCode').optional().isString().trim()
], billingController.calculateCost);

// Subscription Management
router.post('/subscription', [
  body('plan').isIn(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']).withMessage('Invalid plan'),
  body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
], billingController.createSubscription);

router.put('/subscription/upgrade', [
  body('newPlan').isIn(['STARTER', 'BUSINESS', 'ENTERPRISE']).withMessage('Invalid new plan'),
  body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
], billingController.upgradeSubscription);

router.put('/subscription/downgrade', [
  body('newPlan').isIn(['FREE', 'STARTER', 'BUSINESS']).withMessage('Invalid new plan'),
  body('effectiveDate').optional().isISO8601().withMessage('Invalid effective date')
], billingController.downgradeSubscription);

router.delete('/subscription', [
  body('reason').optional().isString().trim().isLength({ max: 500 }).withMessage('Reason too long')
], billingController.cancelSubscription);

router.get('/subscription/status', billingController.getSubscriptionStatus);

// Usage Management
router.get('/usage/check/:feature', [
  param('feature').isIn(['transactions', 'aiCredits', 'users', 'reports']).withMessage('Invalid feature'),
  body('currentUsage').optional().isNumeric().withMessage('Current usage must be numeric')
], billingController.checkUsageLimits);

router.post('/usage/track', [
  body('feature').isIn(['transactions', 'aiCredits', 'users', 'reports']).withMessage('Invalid feature'),
  body('increment').optional().isInt({ min: 1 }).withMessage('Increment must be positive integer')
], billingController.trackUsage);

// AI Credits
router.post('/ai-credits/purchase', paymentLimiter, [
  body('credits').isInt({ min: 1, max: 1000 }).withMessage('Credits must be between 1 and 1000'),
  body('paymentMethod').isIn(['mtn_momo', 'airtel_money', 'card']).withMessage('Invalid payment method'),
  body('paymentDetails.phoneNumber').isMobilePhone('en-UG').withMessage('Invalid Ugandan phone number')
], billingController.purchaseAICredits);

router.get('/ai-credits/stats', [
  query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period')
], billingController.getAIUsageStats);

// Billing History
router.get('/history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format')
], billingController.getBillingHistory);

// Payment Processing
router.post('/payment/process', paymentLimiter, [
  body('amount').isNumeric().withMessage('Amount must be numeric'),
  body('paymentMethod').isIn(['mtn_momo', 'airtel_money', 'card']).withMessage('Invalid payment method'),
  body('phoneNumber').isMobilePhone('en-UG').withMessage('Invalid Ugandan phone number'),
  body('plan').optional().isIn(['STARTER', 'BUSINESS', 'ENTERPRISE']).withMessage('Invalid plan'),
  body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
  body('currency').optional().isIn(['UGX']).withMessage('Invalid currency')
], billingController.processPayment);

router.get('/payment/methods', billingController.getPaymentMethods);

// Payment Webhooks (no authentication required)
router.post('/webhook/mtn', billingController.handleWebhook);
router.post('/webhook/airtel', billingController.handleWebhook);
router.post('/webhook/flutterwave', billingController.handleWebhook);

export default router;
