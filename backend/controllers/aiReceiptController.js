const googleAIService = require('../services/googleAIService');
const Receipt = require('../models/Receipt');
const logger = require('../utils/logger');

/**
 * AI-Powered Receipt Processing Controller
 * Handles intelligent receipt parsing and data extraction
 */

/**
 * Process receipt using AI
 * Extracts vendor, items, totals, and categorizes automatically
 */
exports.processReceiptWithAI = async (req, res) => {
  try {
    const { receipt_text, user_id } = req.body;

    if (!receipt_text) {
      return res.status(400).json({
        success: false,
        error: 'Receipt text is required'
      });
    }

    // Parse with AI
    const parseResult = await googleAIService.parseReceipt(receipt_text);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error
      });
    }

    const receiptData = parseResult.data;

    // Auto-categorize if not provided
    if (!receiptData.category || receiptData.category === 'Other') {
      const categoryResult = await googleAIService.categorizeTransaction(
        receiptData.vendor_name || 'Unknown',
        receiptData.total
      );

      if (categoryResult.success) {
        receiptData.category = categoryResult.category;
      }
    }

    // Save to database if user_id provided
    if (user_id && Receipt) {
      try {
        const receipt = new Receipt({
          userId: user_id,
          storeName: receiptData.vendor_name,
          receiptNumber: receiptData.receipt_number,
          date: receiptData.date,
          items: receiptData.items,
          subtotal: receiptData.subtotal,
          tax: receiptData.tax,
          totalAmount: receiptData.total,
          currency: receiptData.currency,
          processingEngine: 'google_ai',
          confidenceScore: receiptData.confidence_score || 0.95,
          requiresManualReview: false,
          status: 'completed'
        });

        await receipt.save();
        receiptData.receipt_id = receipt._id;

        logger.info('Receipt saved successfully', {
          receipt_id: receipt._id,
          vendor: receiptData.vendor_name,
          total: receiptData.total
        });
      } catch (dbError) {
        logger.error('Failed to save receipt to database:', {
          error: dbError.message,
          vendor: receiptData.vendor_name,
          userId: user_id
        });
        // Still return parsed data but notify about DB save failure
        receiptData.db_save_error = dbError.message;
      }
    }

    res.json({
      success: true,
      message: 'Receipt processed successfully with AI',
      data: receiptData
    });
  } catch (error) {
    logger.error('Receipt processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process receipt'
    });
  }
};

/**
 * Get receipts with optional AI analysis
 */
exports.getReceiptsWithAnalysis = async (req, res) => {
  try {
    const { user_id, analyze = false } = req.query;

    if (!user_id || !Receipt) {
      return res.status(400).json({
        success: false,
        error: 'User ID required and Receipt model must be available'
      });
    }

    const receipts = await Receipt.find({ user_id }).sort({ date: -1 }).limit(50);

    if (analyze && googleAIService.isServiceReady()) {
      // Perform AI analysis on receipts
      const analysisPrompt = `
Analyze these receipts for insights:
${JSON.stringify(receipts)}

Provide:
1. Total spending by category
2. Spending trends
3. Recommendations for cost reduction
4. Any unusual spending patterns`;

      const analysis = await googleAIService.query(analysisPrompt);

      return res.json({
        success: true,
        data: {
          receipts,
          analysis: analysis
        }
      });
    }

    res.json({
      success: true,
      data: { receipts }
    });
  } catch (error) {
    logger.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Batch process multiple receipts
 */
exports.batchProcessReceipts = async (req, res) => {
  try {
    const { receipts, user_id } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Receipts array is required'
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const receiptText of receipts) {
      try {
        const parseResult = await googleAIService.parseReceipt(receiptText);

        if (parseResult.success) {
          results.push({
            success: true,
            data: parseResult.data
          });
          successCount++;
        } else {
          results.push({
            success: false,
            error: parseResult.error
          });
          errorCount++;
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
        errorCount++;
      }
    }

    logger.info('Batch receipt processing completed', {
      total: receipts.length,
      success: successCount,
      errors: errorCount
    });

    res.json({
      success: true,
      message: `Processed ${successCount} of ${receipts.length} receipts`,
      data: {
        summary: {
          total: receipts.length,
          successful: successCount,
          failed: errorCount
        },
        results: results
      }
    });
  } catch (error) {
    logger.error('Batch processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  processReceiptWithAI,
  getReceiptsWithAnalysis,
  batchProcessReceipts
};
