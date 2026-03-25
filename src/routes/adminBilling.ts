import express from 'express';
import { body, param, query } from 'express-validator';
import adminBillingController from '../controllers/adminBillingController.js';
import authMiddleware from '../middleware/authMiddleware';
import isAdmin from '../middleware/isAdmin';

const router = express.Router();

// Apply authentication and admin check to all admin billing routes
router.use(authMiddleware);
router.use(isAdmin);

// Billing Analytics and Statistics
router.get('/stats', [
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format')
], adminBillingController.getBillingStats);

// Subscription Management
router.get('/subscriptions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'cancelled', 'expired', 'suspended']).withMessage('Invalid status'),
  query('plan').optional().isIn(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']).withMessage('Invalid plan'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search term too long')
], adminBillingController.getSubscriptions);

router.get('/users/:userId/billing', [
  param('userId').isMongoId().withMessage('Invalid user ID')
], adminBillingController.getUserBillingDetails);

router.put('/users/:userId/subscription', [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('plan').optional().isIn(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']).withMessage('Invalid plan'),
  body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
  body('action').isIn(['upgrade', 'downgrade', 'cancel', 'activate', 'suspend']).withMessage('Invalid action'),
  body('reason').optional().isString().trim().isLength({ max: 500 }).withMessage('Reason too long')
], adminBillingController.updateUserSubscription);

// Transaction Management
router.get('/transactions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
  query('type').optional().isIn(['subscription_payment', 'ai_credit_purchase', 'transaction_fee']).withMessage('Invalid type'),
  query('paymentMethod').optional().isIn(['mtn_momo', 'airtel_money', 'card', 'bank_transfer']).withMessage('Invalid payment method'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search term too long')
], adminBillingController.getTransactions);

// AI Credits Management
router.post('/users/:userId/ai-credits', [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('credits').isInt({ min: 1, max: 10000 }).withMessage('Credits must be between 1 and 10000'),
  body('reason').optional().isString().trim().isLength({ max: 500 }).withMessage('Reason too long')
], adminBillingController.addAICredits);

// Revenue Analytics
router.get('/revenue/payment-methods', [
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format')
], adminBillingController.getRevenueByPaymentMethod);

// Data Export
router.get('/export', [
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format')
], adminBillingController.exportBillingData);

// Admin Tasks
router.post('/process-expiring', adminBillingController.processExpiringSubscriptions);

export default router;
