const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const companyController = require('../controllers/companyController');
const { authenticate } = require('../middleware/auth');

/**
 * Company Routes
 * Base path: /api/company
 */

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/company
 * @desc    Create a new company (onboarding)
 * @access  Private
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('address.country')
      .notEmpty()
      .withMessage('Country is required'),
    body('baseCurrency.code')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'UGX', 'KES', 'TZS', 'NGN', 'GHS', 'ZAR'])
      .withMessage('Invalid currency code')
  ],
  companyController.createCompany
);

/**
 * @route   GET /api/company
 * @desc    Get current user's company
 * @access  Private
 */
router.get('/', companyController.getCompany);

/**
 * @route   PUT /api/company/:id
 * @desc    Update company details
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  companyController.updateCompany
);

/**
 * @route   POST /api/company/:id/members
 * @desc    Add member to company
 * @access  Private (Admin only)
 */
router.post(
  '/:id/members',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'accountant', 'viewer'])
      .withMessage('Invalid role')
  ],
  companyController.addMember
);

/**
 * @route   DELETE /api/company/:id/members/:userId
 * @desc    Remove member from company
 * @access  Private (Admin or self)
 */
router.delete('/:id/members/:userId', companyController.removeMember);

/**
 * @route   PUT /api/company/:id/settings
 * @desc    Update company settings
 * @access  Private
 */
router.put(
  '/:id/settings',
  [
    body('baseCurrency.code')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'ZMW'])
      .withMessage('Invalid currency code'),
    body('timezone')
      .optional()
      .isString(),
    body('dateFormat')
      .optional()
      .isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'])
  ],
  companyController.updateSettings
);

module.exports = router;
