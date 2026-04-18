const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const googleAIService = require('../services/googleAIService');
const logger = require('../utils/logger');

/**
 * AI-Powered Accounting Features Routes
 * Base path: /api/ai
 * All routes require authentication
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/ai/parse-receipt
 * @desc    Parse receipt text using Google AI
 * @access  Private
 * @body    { receipt_text: string }
 */
router.post('/parse-receipt', async (req, res) => {
  try {
    const { receipt_text } = req.body;

    if (!receipt_text || receipt_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Receipt text is required'
      });
    }

    if (!googleAIService.isServiceReady()) {
      return res.status(503).json({
        success: false,
        error: 'Google AI Service is not available. Configure GOOGLE_API_KEY in environment.'
      });
    }

    const result = await googleAIService.parseReceipt(receipt_text);

    if (result.success) {
      res.json({
        success: true,
        message: 'Receipt parsed successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Receipt parsing endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse receipt'
    });
  }
});

/**
 * @route   POST /api/ai/analyze-financials
 * @desc    Analyze financial data with natural language query
 * @access  Private
 * @body    { query: string, transactions: Array (optional) }
 */
router.post('/analyze-financials', async (req, res) => {
  try {
    const { query, transactions } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    if (!googleAIService.isServiceReady()) {
      return res.status(503).json({
        success: false,
        error: 'Google AI Service is not available'
      });
    }

    const result = await googleAIService.analyzeFinancials(query, transactions || []);

    if (result.success) {
      res.json({
        success: true,
        message: 'Financial analysis completed',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Financial analysis endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze financials'
    });
  }
});

/**
 * @route   POST /api/ai/generate-email
 * @desc    Generate professional email draft
 * @access  Private
 * @body    { type: string, recipientName: string, amount?: number, dueDate?: string, tone?: string }
 */
router.post('/generate-email', async (req, res) => {
  try {
    const { type, recipientName, amount, dueDate, tone } = req.body;

    if (!type || !recipientName) {
      return res.status(400).json({
        success: false,
        error: 'Email type and recipient name are required'
      });
    }

    if (!googleAIService.isServiceReady()) {
      return res.status(503).json({
        success: false,
        error: 'Google AI Service is not available'
      });
    }

    const result = await googleAIService.generateEmail({
      type,
      recipientName,
      amount,
      dueDate,
      tone: tone || 'professional'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email generated successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Email generation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate email'
    });
  }
});

/**
 * @route   POST /api/ai/detect-anomalies
 * @desc    Detect fraud and anomalies in transactions
 * @access  Private
 * @body    { transactions: Array }
 */
router.post('/detect-anomalies', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transactions array is required and must not be empty'
      });
    }

    if (!googleAIService.isServiceReady()) {
      return res.status(503).json({
        success: false,
        error: 'Google AI Service is not available'
      });
    }

    const result = await googleAIService.detectAnomalies(transactions);

    if (result.success) {
      res.json({
        success: true,
        message: 'Anomaly detection completed',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        data: result.data
      });
    }
  } catch (error) {
    logger.error('Anomaly detection endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to detect anomalies'
    });
  }
});

/**
 * @route   POST /api/ai/categorize-transaction
 * @desc    Categorize transaction automatically
 * @access  Private
 * @body    { description: string, amount: number }
 */
router.post('/categorize-transaction', async (req, res) => {
  try {
    const { description, amount } = req.body;

    if (!description || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Transaction description and amount are required'
      });
    }

    if (!googleAIService.isServiceReady()) {
      return res.status(503).json({
        success: false,
        error: 'Google AI Service is not available'
      });
    }

    const result = await googleAIService.categorizeTransaction(description, amount);

    res.json({
      success: result.success,
      data: {
        category: result.category
      }
    });
  } catch (error) {
    logger.error('Transaction categorization endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to categorize transaction'
    });
  }
});

/**
 * @route   GET /api/ai/status
 * @desc    Check Google AI service status
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const status = googleAIService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
