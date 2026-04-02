const express = require('express');
const router = express.Router();
const forexService = require('../services/forexService');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Forex Routes
 * Base path: /api/forex
 */

router.use(authenticate);

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

/**
 * @route   POST /api/forex/update-transaction
 * @desc    Update transaction with current forex rates
 * @access  Private
 */
router.post('/update-transaction', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency = 'USD' } = req.body;

    if (!amount || !fromCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, fromCurrency'
      });
    }

    const transaction = {
      amount,
      currency: fromCurrency,
    };

    const updated = await forexService.updateTransactionWithCurrentRates(
      transaction,
      toCurrency
    );

    if (!updated) {
      return res.status(503).json({
        success: false,
        message: 'Unable to fetch current rates'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        amount: updated.amount,
        currency: updated.currency,
        convertedAmount: updated.convertedAmount,
        conversionRate: updated.conversionRate,
        lastUpdated: updated.lastUpdated,
      }
    });
  } catch (error) {
    logger.error('Error updating transaction with rates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update transaction rates'
    });
  }
});

/**
 * @route   POST /api/forex/batch-update
 * @desc    Batch update multiple transactions with current rates
 * @access  Private
 */
router.post('/batch-update', async (req, res) => {
  try {
    const { transactions, toCurrency = 'USD' } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transactions array'
      });
    }

    const updated = await forexService.batchUpdateTransactions(
      transactions,
      toCurrency
    );

    return res.status(200).json({
      success: true,
      data: {
        count: updated.length,
        transactions: updated,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    logger.error('Error batch updating transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to batch update transactions'
    });
  }
});

/**
 * @route   GET /api/forex/trend
 * @desc    Get historical exchange rate trend data
 * @access  Private
 */
router.get('/trend', async (req, res) => {
  try {
    const { from = 'USD', to = 'UGX', days = 7 } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Missing currency parameters (from, to)'
      });
    }

    const trend = await forexService.getExchangeRateTrend(
      from,
      to,
      parseInt(days)
    );

    return res.status(200).json({
      success: true,
      data: {
        from,
        to,
        days: parseInt(days),
        trend,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    logger.error('Error fetching exchange rate trend:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rate trend'
    });
  }
});

/**
 * @route   GET /api/forex/stats
 * @desc    Get dashboard statistics for currency pairs
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await forexService.getForexStats();

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    logger.error('Error fetching forex stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch forex statistics'
    });
  }
});

module.exports = router;
