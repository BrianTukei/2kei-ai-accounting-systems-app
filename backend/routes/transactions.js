const express = require('express');
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Transaction Routes
 * Base path: /api/transactions
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/transactions
 * @desc    Get user's transactions with pagination and filtering
 * @access  Private
 */
router.get(
  '/',
  transactionController.getTransactions
);

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private
 */
router.post(
  '/',
  [
    body('type')
      .isIn(['income', 'expense', 'transfer', 'refund', 'adjustment'])
      .withMessage('Invalid transaction type'),
    body('amount.value')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number'),
    body('amount.currency.code')
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 3, max: 500 })
      .withMessage('Description must be between 3 and 500 characters'),
    body('transactionDate')
      .isISO8601()
      .withMessage('Transaction date must be a valid date'),
    body('counterparty.name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Counterparty name cannot be empty')
  ],
  transactionController.createTransaction
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get(
  '/:id',
  transactionController.getTransactionById
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('type')
      .optional()
      .isIn(['income', 'expense', 'transfer', 'refund', 'adjustment'])
      .withMessage('Invalid transaction type'),
    body('amount.value')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number'),
    body('category')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Category cannot be empty'),
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Description cannot be empty')
      .isLength({ min: 3, max: 500 })
      .withMessage('Description must be between 3 and 500 characters'),
    body('transactionDate')
      .optional()
      .isISO8601()
      .withMessage('Transaction date must be a valid date')
  ],
  transactionController.updateTransaction
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete(
  '/:id',
  transactionController.deleteTransaction
);

/**
 * @route   GET /api/transactions/summary
 * @desc    Get transaction summary and statistics
 * @access  Private
 */
router.get(
  '/summary',
  transactionController.getTransactionSummary
);

/**
 * @route   GET /api/transactions/categories
 * @desc    Get transaction categories
 * @access  Private
 */
router.get(
  '/categories',
  transactionController.getCategories
);

module.exports = router;
