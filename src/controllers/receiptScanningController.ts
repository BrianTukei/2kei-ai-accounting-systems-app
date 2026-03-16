import { Request, Response } from 'express';
import { enhancedReceiptScanner } from '../services/ai/enhancedReceiptScanner';
import { ReceiptScanResult } from '../services/ai/enhancedReceiptScanner';

export class ReceiptScanningController {
  // Single receipt scanning
  async scanReceipt(req: Request, res: Response) {
    try {
      const { imageData, ocrText } = req.body;
      
      if (!imageData && !ocrText) {
        return res.status(400).json({
          success: false,
          error: 'Either imageData or ocrText is required'
        });
      }

      const result = await enhancedReceiptScanner.scanReceipt(imageData || '', ocrText);
      
      res.json({
        success: result.success,
        data: result.data,
        warnings: result.warnings,
        processingTime: result.processingTime,
        message: result.success ? 'Receipt scanned successfully' : 'Failed to scan receipt',
        error: result.error
      });
    } catch (error) {
      console.error('Receipt scanning failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Batch receipt processing
  async scanBatchReceipts(req: Request, res: Response) {
    try {
      const { files } = req.body;
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Files array is required'
        });
      }

      const results = await enhancedReceiptScanner.processBatchReceipts(files);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      res.json({
        success: true,
        data: {
          total: results.length,
          successful,
          failed,
          results
        },
        message: `Processed ${results.length} receipts: ${successful} successful, ${failed} failed`
      });
    } catch (error) {
      console.error('Batch receipt scanning failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get scanning statistics
  async getScanningStats(req: Request, res: Response) {
    try {
      // Mock statistics - in production, fetch from database
      const stats = {
        totalScanned: 156,
        successfulScans: 142,
        failedScans: 14,
        averageProcessingTime: 2.3,
        averageConfidence: 87,
        topCategories: [
          { category: 'Food', count: 45 },
          { category: 'Transport', count: 32 },
          { category: 'Office Supplies', count: 28 },
          { category: 'Utilities', count: 18 },
          { category: 'Other', count: 33 }
        ]
      };

      res.json({
        success: true,
        data: stats,
        message: 'Scanning statistics retrieved'
      });
    } catch (error) {
      console.error('Failed to get scanning stats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Validate scanned receipt
  async validateReceipt(req: Request, res: Response) {
    try {
      const { receiptData } = req.body;
      
      if (!receiptData) {
        return res.status(400).json({
          success: false,
          error: 'Receipt data is required'
        });
      }

      // Perform validation checks
      const validation = {
        isValid: true,
        checks: {
          hasMerchant: !!(receiptData.merchant && receiptData.merchant !== 'Not Found'),
          hasDate: !!(receiptData.date && receiptData.date !== 'Not Found'),
          hasTotal: !!(receiptData.total && receiptData.total > 0),
          hasItems: !!(receiptData.items && receiptData.items.length > 0),
          totalMatches: true, // Would calculate from items
          confidenceAcceptable: (receiptData.confidence || 0) > 70
        },
        suggestions: []
      };

      if (!validation.checks.hasMerchant) {
        validation.suggestions.push('Merchant name is missing - please verify the receipt image quality');
      }
      if (!validation.checks.hasDate) {
        validation.suggestions.push('Date is missing - may need manual entry');
      }
      if (!validation.checks.hasTotal) {
        validation.suggestions.push('Total amount is missing - critical field for accounting');
      }
      if (!validation.checks.confidenceAcceptable) {
        validation.suggestions.push('Low confidence score - recommend manual review');
      }

      validation.isValid = Object.values(validation.checks).every(check => check);

      res.json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Receipt is valid' : 'Receipt validation found issues'
      });
    } catch (error) {
      console.error('Receipt validation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const receiptScanningController = new ReceiptScanningController();
export default ReceiptScanningController;
