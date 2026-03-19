/**
 * Intelligent Receipt Scanner
 * ────────────────────────────────────────────────────────────────────────────
 * Advanced AI-powered receipt scanning with OCR, expense categorization,
 * duplicate detection, and intelligent data extraction.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { FinancialSnapshot } from './types';

// ── Receipt Data Types ────────────────────────────────────────────────────────

export interface ReceiptData {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  date: Date;
  category: string;
  paymentMethod: string;
  items?: ReceiptItem[];
  confidence: number;
  rawText?: string;
  imageUrl?: string;
  metadata: ReceiptMetadata;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  confidence: number;
}

export interface ReceiptMetadata {
  extractedAt: Date;
  processingTime: number;
  ocrEngine: string;
  aiModel: string;
  duplicateCheck: boolean;
  verified: boolean;
  tags: string[];
}

export interface ScanResult {
  success: boolean;
  receipt?: ReceiptData;
  errors?: string[];
  warnings?: string[];
  duplicates?: ReceiptData[];
}

// ── OCR Engine Interface ─────────────────────────────────────────────────────

interface OCREngine {
  extractText(imageFile: File): Promise<string>;
  extractStructuredData(imageFile: File): Promise<Partial<ReceiptData>>;
}

class MockOCREngine implements OCREngine {
  async extractText(imageFile: File): Promise<string> {
    // Mock OCR extraction - in production, this would call a real OCR service
    return `
      STARBUCKS #1234
      123 MAIN ST
      NEW YORK, NY 10001
      
      DATE: 03/19/2026
      TIME: 09:15 AM
      
      VENTI COFFEE        $5.45
      CROISSANT          $3.25
      TAX                 $0.69
      
      TOTAL              $9.39
      CARD ****1234
    `;
  }

  async extractStructuredData(imageFile: File): Promise<Partial<ReceiptData>> {
    const text = await this.extractText(imageFile);
    return this.parseReceiptText(text);
  }

  private parseReceiptText(text: string): Partial<ReceiptData> {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract merchant name (usually first non-empty line)
    const merchant = lines[0] || 'Unknown Merchant';
    
    // Extract date
    const dateMatch = text.match(/DATE:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    const date = dateMatch ? new Date(dateMatch[1]) : new Date();
    
    // Extract total amount
    const totalMatch = text.match(/TOTAL\s*\$?(\d+\.\d{2})/i);
    const amount = totalMatch ? parseFloat(totalMatch[1]) : 0;
    
    // Extract payment method
    const paymentMatch = text.match(/(?:CARD|CASH|CREDIT)\s*(\*{4,}\d{4}|\d+)/i);
    const paymentMethod = paymentMatch ? paymentMatch[0] : 'Unknown';
    
    // Extract items
    const items = this.extractItems(text);
    
    return {
      merchant,
      amount,
      currency: 'USD',
      date,
      paymentMethod,
      items,
      confidence: 0.85,
      rawText: text,
    };
  }

  private extractItems(text: string): ReceiptItem[] {
    const itemLines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      // Look for lines with item name and price pattern
      return trimmed && /\$?\d+\.\d{2}$/.test(trimmed) && !trimmed.includes('TOTAL') && !trimmed.includes('TAX');
    });

    return itemLines.map(line => {
      const trimmed = line.trim();
      const priceMatch = trimmed.match(/(.+)\s+\$?(\d+\.\d{2})$/);
      
      if (priceMatch) {
        const name = priceMatch[1].trim();
        const price = parseFloat(priceMatch[2]);
        
        return {
          name,
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
          confidence: 0.8,
        };
      }
      
      return null;
    }).filter(Boolean) as ReceiptItem[];
  }
}

// ── AI Categorization Engine ─────────────────────────────────────────────────

class AICategorizationEngine {
  private categoryMappings = new Map([
    // Food & Dining
    ['starbucks', 'food_dining'],
    ['restaurant', 'food_dining'],
    ['cafe', 'food_dining'],
    ['coffee', 'food_dining'],
    
    // Transportation
    ['uber', 'transportation'],
    ['lyft', 'transportation'],
    ['taxi', 'transportation'],
    ['gas', 'transportation'],
    ['parking', 'transportation'],
    
    // Office Supplies
    ['staples', 'office_supplies'],
    ['office depot', 'office_supplies'],
    ['amazon', 'office_supplies'],
    
    // Utilities
    ['electric', 'utilities'],
    ['water', 'utilities'],
    ['internet', 'utilities'],
    ['phone', 'utilities'],
    
    // Travel
    ['hotel', 'travel'],
    ['airline', 'travel'],
    ['expedia', 'travel'],
    ['booking.com', 'travel'],
  ]);

  categorizeReceipt(receipt: Partial<ReceiptData>): string {
    const merchant = (receipt.merchant || '').toLowerCase();
    const items = receipt.items || [];
    
    // Check merchant name first
    for (const [keyword, category] of this.categoryMappings) {
      if (merchant.includes(keyword)) {
        return category;
      }
    }
    
    // Check item names
    for (const item of items) {
      const itemName = item.name.toLowerCase();
      for (const [keyword, category] of this.categoryMappings) {
        if (itemName.includes(keyword)) {
          return category;
        }
      }
    }
    
    // Default categorization based on amount and merchant type
    if (receipt.amount && receipt.amount > 100) {
      return 'other_expenses';
    }
    
    return 'miscellaneous';
  }

  categorizeItem(item: ReceiptItem): string {
    const itemName = item.name.toLowerCase();
    
    for (const [keyword, category] of this.categoryMappings) {
      if (itemName.includes(keyword)) {
        return category;
      }
    }
    
    return 'miscellaneous';
  }
}

// ── Duplicate Detection Engine ───────────────────────────────────────────────

class DuplicateDetectionEngine {
  private recentReceipts = new Map<string, ReceiptData>();

  addReceipt(receipt: ReceiptData): void {
    this.recentReceipts.set(receipt.id, receipt);
    
    // Keep only last 1000 receipts for memory management
    if (this.recentReceipts.size > 1000) {
      const oldestKey = this.recentReceipts.keys().next().value;
      this.recentReceipts.delete(oldestKey);
    }
  }

  findDuplicates(receipt: Partial<ReceiptData>): ReceiptData[] {
    const duplicates: ReceiptData[] = [];
    
    for (const [id, existingReceipt] of this.recentReceipts) {
      if (this.isDuplicate(receipt, existingReceipt)) {
        duplicates.push(existingReceipt);
      }
    }
    
    return duplicates;
  }

  private isDuplicate(newReceipt: Partial<ReceiptData>, existing: ReceiptData): boolean {
    // Check exact match on amount and date
    if (newReceipt.amount === existing.amount && 
        newReceipt.merchant === existing.merchant &&
        Math.abs((newReceipt.date?.getTime() || 0) - existing.date.getTime()) < 24 * 60 * 60 * 1000) {
      return true;
    }
    
    // Check close match on amount and merchant
    if (newReceipt.merchant === existing.merchant &&
        Math.abs((newReceipt.amount || 0) - existing.amount) < 0.01) {
      return true;
    }
    
    return false;
  }
}

// ── Main Intelligent Receipt Scanner Class ───────────────────────────────────

export class IntelligentReceiptScanner {
  private ocrEngine: OCREngine;
  private categorizationEngine: AICategorizationEngine;
  private duplicateEngine: DuplicateDetectionEngine;

  constructor() {
    this.ocrEngine = new MockOCREngine();
    this.categorizationEngine = new AICategorizationEngine();
    this.duplicateEngine = new DuplicateDetectionEngine();
  }

  /**
   * Scan and process a receipt image
   */
  async scanReceipt(imageFile: File): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      // 1. Extract text and structured data using OCR
      const extractedData = await this.ocrEngine.extractStructuredData(imageFile);
      
      // 2. Validate extracted data
      const validation = this.validateExtractedData(extractedData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // 3. Categorize the receipt
      const category = this.categorizationEngine.categorizeReceipt(extractedData);
      
      // 4. Categorize individual items
      const items = extractedData.items?.map(item => ({
        ...item,
        category: this.categorizationEngine.categorizeItem(item),
      }));

      // 5. Check for duplicates
      const receiptData: ReceiptData = {
        id: this.generateReceiptId(),
        merchant: extractedData.merchant || 'Unknown Merchant',
        amount: extractedData.amount || 0,
        currency: extractedData.currency || 'USD',
        date: extractedData.date || new Date(),
        category,
        paymentMethod: extractedData.paymentMethod || 'Unknown',
        items,
        confidence: extractedData.confidence || 0.5,
        rawText: extractedData.rawText,
        imageUrl: URL.createObjectURL(imageFile),
        metadata: {
          extractedAt: new Date(),
          processingTime: Date.now() - startTime,
          ocrEngine: 'MockOCR',
          aiModel: 'IntelligentScanner v1.0',
          duplicateCheck: true,
          verified: false,
          tags: this.generateTags(extractedData),
        },
      };

      const duplicates = this.duplicateEngine.findDuplicates(receiptData);
      
      // 6. Add to duplicate detection database
      this.duplicateEngine.addReceipt(receiptData);

      // 7. Return result
      return {
        success: true,
        receipt: receiptData,
        warnings: validation.warnings,
        duplicates: duplicates.length > 0 ? duplicates : undefined,
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [`Scanning failed: ${error.message}`],
      };
    }
  }

  /**
   * Validate extracted receipt data
   */
  private validateExtractedData(data: Partial<ReceiptData>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.merchant) errors.push('Merchant name not found');
    if (!data.amount || data.amount <= 0) errors.push('Valid amount not found');
    if (!data.date) errors.push('Date not found');

    // Data quality checks
    if (data.amount && data.amount > 10000) {
      warnings.push('Amount seems unusually high');
    }
    
    if (data.date && data.date > new Date()) {
      warnings.push('Receipt date is in the future');
    }

    // Confidence check
    if (data.confidence && data.confidence < 0.7) {
      warnings.push('Low confidence in extracted data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate unique receipt ID
   */
  private generateReceiptId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate tags for better organization
   */
  private generateTags(data: Partial<ReceiptData>): string[] {
    const tags: string[] = [];
    
    if (data.amount && data.amount > 100) tags.push('high_value');
    if (data.paymentMethod?.includes('CARD')) tags.push('card_payment');
    if (data.paymentMethod?.includes('CASH')) tags.push('cash_payment');
    
    const merchant = (data.merchant || '').toLowerCase();
    if (merchant.includes('starbucks') || merchant.includes('coffee')) tags.push('beverage');
    if (merchant.includes('restaurant') || merchant.includes('food')) tags.push('dining');
    
    return tags;
  }

  /**
   * Get statistics about scanned receipts
   */
  getStats() {
    return {
      totalReceipts: this.duplicateEngine['recentReceipts'].size,
      categories: this.getCategoryBreakdown(),
      averageAmount: this.getAverageAmount(),
    };
  }

  private getCategoryBreakdown(): Record<string, number> {
    const receipts = Array.from(this.duplicateEngine['recentReceipts'].values());
    const breakdown: Record<string, number> = {};
    
    receipts.forEach(receipt => {
      breakdown[receipt.category] = (breakdown[receipt.category] || 0) + 1;
    });
    
    return breakdown;
  }

  private getAverageAmount(): number {
    const receipts = Array.from(this.duplicateEngine['recentReceipts'].values());
    if (receipts.length === 0) return 0;
    
    const total = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    return total / receipts.length;
  }
}

// ── Export singleton instance ─────────────────────────────────────────────────

export const intelligentReceiptScanner = new IntelligentReceiptScanner();
export default intelligentReceiptScanner;
