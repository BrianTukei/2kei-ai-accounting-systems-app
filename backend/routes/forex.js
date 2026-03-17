const express = require('express');
const router = express.Router();
const forexService = require('../services/forexService');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Forex Routes
 * Base path: /api/forex
 */

router.use(authMiddleware);

/**
 * @route   GET /api/forex/rates
 * @desc    Get all exchange rates for base currency
 * @access  Private
 */
router.get('/rates', async (req, res) => {
  try {
    const { base = 'USD' } = req.query;
    const rates = await forexService.getAllRates(base);
    
    return res.status(200).json({
      success: true,
      data: {
        base,
        rates,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error fetching rates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates'
    });
  }
});

/**
 * @route   GET /api/forex/convert
 * @desc    Convert amount between currencies
 * @access  Private
 */
router.get('/convert', async (req, res) => {
  try {
    const { amount, from = 'USD', to = 'USD' } = req.query;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const result = await forexService.convert(
      parseFloat(amount),
      from,
      to
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error converting currency:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert currency'
    });
  }
});

/**
 * @route   GET /api/forex/currencies
 * @desc    Get all supported currencies
 * @access  Private
 */
router.get('/currencies', (req, res) => {
  try {
    const { region } = req.query;
    
    let currencies;
    if (region === 'africa') {
      currencies = forexService.getAfricanCurrencies();
    } else {
      currencies = forexService.getSupportedCurrencies();
    }

    return res.status(200).json({
      success: true,
      data: { currencies }
    });
  } catch (error) {
    logger.error('Error fetching currencies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch currencies'
    });
  }
});

/**
 * @route   POST /api/forex/format
 * @desc    Format amount with currency symbol
 * @access  Private
 */
router.post('/format', (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body;
    
    const formatted = forexService.formatAmount(amount, currency);
    const info = forexService.getCurrencyInfo(currency);

    return res.status(200).json({
      success: true,
      data: {
        formatted,
        currency: info
      }
    });
  } catch (error) {
    logger.error('Error formatting amount:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to format amount'
    });
  }
});

module.exports = router;
