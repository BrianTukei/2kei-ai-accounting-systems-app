import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import { backendAIService, ExtractedReceiptData } from '../services/ai/backendAIService';
import { useAuth } from '../contexts/AuthContext';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPG, PNG, WebP) and PDF files are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

export class ReceiptScannerAPI {
  /**
   * POST /api/scan-receipt
   * Upload and process receipt image
   */
  static async scanReceipt(req: Request, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if AI service is available
      const isAvailable = await backendAIService.isServiceAvailable();
      if (!isAvailable) {
        return res.status(503).json({ 
          error: 'AI service is not available. Please ensure Ollama is running with llama3 model.',
          code: 'AI_SERVICE_UNAVAILABLE'
        });
      }

      const uploadSingle = upload.single('receipt');
      
      uploadSingle(req, res, async (err) => {
        if (err) {
          console.error('File upload error:', err);
          return res.status(400).json({ 
            error: 'File upload failed',
            details: err.message 
          });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
          // Process the receipt
          const result = await ReceiptScannerAPI.processReceipt(
            req.file.path,
            req.user.id,
            req.user.companyId
          );

          // Clean up uploaded file
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.warn('Failed to cleanup uploaded file:', cleanupError);
          }

          res.json(result);
        } catch (processingError) {
          console.error('Receipt processing error:', processingError);
          
          // Clean up uploaded file on error
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.warn('Failed to cleanup uploaded file:', cleanupError);
          }

          res.status(500).json({ 
            error: 'Receipt processing failed',
            details: processingError.message 
          });
        }
      });
    } catch (error) {
      console.error('Scan receipt API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process receipt image through OCR and AI
   */
  private static async processReceipt(
    filePath: string,
    userId: string,
    companyId?: string
  ): Promise<{
    success: boolean;
    data?: ExtractedReceiptData;
    ocrText?: string;
    confidence?: number;
    issues?: string[];
    processingTime?: number;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: OCR Text Extraction
      console.log('Starting OCR processing for:', filePath);
      const ocrResult = await Tesseract.recognize(filePath, 'eng');
      const extractedText = ocrResult.data.text;

      if (!extractedText || extractedText.trim().length < 10) {
        return {
          success: false,
          ocrText: extractedText,
          issues: ['Receipt text could not be extracted or is too short'],
          processingTime: Date.now() - startTime
        };
      }

      console.log('OCR extracted text length:', extractedText.length);

      // Step 2: Validate receipt quality
      const validation = await backendAIService.validateReceipt(extractedText);
      
      if (!validation.isReadable || validation.confidence < 0.3) {
        return {
          success: false,
          ocrText: extractedText,
          confidence: validation.confidence,
          issues: validation.issues.concat(['Receipt quality is too low for reliable processing']),
          processingTime: Date.now() - startTime
        };
      }

      // Step 3: AI Data Extraction
      console.log('Starting AI data extraction');
      const extractedData = await backendAIService.extractReceiptData({
        text: extractedText,
        userId,
        companyId
      });

      // Step 4: Save to database (in a real implementation)
      await ReceiptScannerAPI.saveExpenseToDatabase(extractedData, userId, companyId);

      return {
        success: true,
        data: extractedData,
        ocrText: extractedText,
        confidence: extractedData.confidence || validation.confidence,
        issues: validation.issues,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Receipt processing failed:', error);
      throw error;
    }
  }

  /**
   * Save extracted expense data to database
   * In a real implementation, this would save to MongoDB
   */
  private static async saveExpenseToDatabase(
    data: ExtractedReceiptData,
    userId: string,
    companyId?: string
  ): Promise<void> {
    try {
      // In a real implementation, this would save to MongoDB
      // For now, we'll simulate the database save with localStorage
      
      const expense = {
        id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vendor: data.vendor,
        amount: data.total,
        category: data.category,
        date: data.date,
        items: data.items,
        currency: data.currency,
        userId,
        companyId,
        createdAt: new Date().toISOString(),
        source: 'ai-receipt-scanner',
        confidence: data.confidence,
        status: 'active'
      };

      // Simulate database save (in real app, use MongoDB/Mongoose)
      const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      existingExpenses.push(expense);
      localStorage.setItem('expenses', JSON.stringify(existingExpenses));

      console.log('Expense saved to database:', expense.id);
    } catch (error) {
      console.error('Failed to save expense to database:', error);
      throw new Error('Failed to save expense data');
    }
  }

  /**
   * GET /api/receipts
   * Get user's receipt-scanned expenses
   */
  static async getUserReceipts(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // In a real implementation, query MongoDB
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      const userExpenses = expenses.filter((expense: any) => 
        expense.userId === req.user.id && expense.source === 'ai-receipt-scanner'
      );

      res.json({
        success: true,
        data: userExpenses,
        total: userExpenses.length
      });
    } catch (error) {
      console.error('Get user receipts error:', error);
      res.status(500).json({ error: 'Failed to retrieve receipts' });
    }
  }

  /**
   * POST /api/validate-receipt
   * Validate receipt text before full processing
   */
  static async validateReceipt(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Receipt text is required' });
      }

      const validation = await backendAIService.validateReceipt(text);

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Validate receipt error:', error);
      res.status(500).json({ error: 'Receipt validation failed' });
    }
  }

  /**
   * GET /api/ai-status
   * Check AI service status and available models
   */
  static async getAIStatus(req: Request, res: Response) {
    try {
      const isAvailable = await backendAIService.isServiceAvailable();
      const models = await backendAIService.listAvailableModels();
      const serviceInfo = backendAIService.getServiceInfo();

      res.json({
        success: true,
        data: {
          available: isAvailable,
          models,
          service: serviceInfo,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('AI status check error:', error);
      res.status(500).json({ error: 'Failed to check AI status' });
    }
  }

  /**
   * DELETE /api/receipts/:id
   * Delete a specific receipt-scanned expense
   */
  static async deleteReceipt(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Receipt ID is required' });
      }

      // In a real implementation, delete from MongoDB
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      const updatedExpenses = expenses.filter((expense: any) => 
        !(expense.id === id && expense.userId === req.user.id)
      );
      
      localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

      res.json({
        success: true,
        message: 'Receipt deleted successfully'
      });
    } catch (error) {
      console.error('Delete receipt error:', error);
      res.status(500).json({ error: 'Failed to delete receipt' });
    }
  }

  /**
   * POST /api/categorize-expense
   * AI-powered expense categorization
   */
  static async categorizeExpense(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { vendor, items, amount } = req.body;
      
      if (!vendor || !amount) {
        return res.status(400).json({ error: 'Vendor and amount are required' });
      }

      const category = await backendAIService.categorizeExpense(
        vendor,
        items || [],
        parseFloat(amount)
      );

      res.json({
        success: true,
        data: { category }
      });
    } catch (error) {
      console.error('Categorize expense error:', error);
      res.status(500).json({ error: 'Failed to categorize expense' });
    }
  }
}

// Export the upload middleware for use in routes
export const uploadReceipt = upload.single('receipt');
