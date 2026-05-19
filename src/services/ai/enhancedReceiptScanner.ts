import { aiReasoningEngine } from './aiReasoningEngine';
import { receiptParser } from './receiptParser';

export interface ExtractedReceiptData {
  merchant: string;
  receipt_number: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  currency: string;
  category: string;
  confidence: number;
  rawText: string;
}

export interface ReceiptScanResult {
  success: boolean;
  data?: ExtractedReceiptData;
  error?: string;
  warnings: string[];
  processingTime: number;
}

export class EnhancedReceiptScanner {
  private readonly PROFESSIONAL_RECEIPT_PROMPT = `You are a professional accounting data extraction AI used in financial software. Accuracy is critical. Extract only verifiable information from the receipt.

Your task is to analyze receipt text extracted from an image and convert it into structured accounting data.

Carefully read the receipt and extract the following information:

1. Merchant/Business Name
2. Receipt Number or Invoice Number
3. Date of Purchase (YYYY-MM-DD format)
4. Time of Purchase (if available, HH:MM format)
5. Items Purchased (each item and its price)
6. Subtotal (before tax)
7. Tax/VAT amount
8. Discount (if any)
9. Total Amount Paid
10. Payment Method (Cash, Card, Mobile Money, Bank Transfer, etc.)
11. Currency (USD, UGX, KES, TZS, RWF, EUR, GBP, etc.)
12. Category of expense (Food, Transport, Office Supplies, Utilities, Equipment, Rent, Subscriptions, Healthcare, Marketing, Professional Services, Entertainment, Banking, Other)

STRICT RULES:
- If a field is missing or cannot be determined, return "Not Found" for that field
- Ensure all numbers are clean integers or decimals without currency symbols
- Do NOT guess values that are not present on the receipt
- Convert all dates to YYYY-MM-DD format
- Return ONLY valid JSON, no markdown formatting
- Extract the exact merchant name as shown on the receipt
- Calculate totals if subitems are present: sum of items = subtotal
- For Mobile Money receipts, extract the transaction code as receipt_number
- Categorize based on merchant type and items purchased

EXPENSE CATEGORIES:
- Food: Restaurants, groceries, cafes, meals
- Transport: Fuel, taxis, rideshare, public transport
- Office Supplies: Stationery, computers, printers, software
- Utilities: Electricity, water, internet, phone bills
- Equipment: Machinery, tools, vehicles
- Rent: Property lease, office space
- Subscriptions: Software licenses, streaming services
- Healthcare: Medical bills, pharmacy, insurance
- Marketing: Advertising, promotions, social media
- Professional Services: Legal, accounting, consulting
- Entertainment: Events, recreation, movies
- Banking: Bank fees, interest, charges
- Other: Miscellaneous expenses

Return the output strictly in JSON format with this exact structure:
{
  "merchant": "string",
  "receipt_number": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or Not Found",
  "items": [{"name": "string", "price": number, "quantity": number}],
  "subtotal": number,
  "tax": number,
  "discount": number,
  "total": number,
  "payment_method": "string",
  "currency": "string",
  "category": "string"
}`;

  async scanReceipt(imageData: string | File, ocrText?: string): Promise<ReceiptScanResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      let extractedText: string;

      if (ocrText) {
        extractedText = ocrText;
      } else if (typeof imageData === 'string') {
        // Assume it's already OCR'd text or base64 image
        extractedText = imageData;
      } else {
        // Perform OCR on image file
        extractedText = await this.performOCR(imageData);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return {
          success: false,
          error: 'No text could be extracted from the receipt',
          warnings: ['OCR failed to extract any readable text'],
          processingTime: Date.now() - startTime
        };
      }

      // Use AI to extract structured data
      const extractedData = await this.extractDataWithAI(extractedText);
      
      // Validate the extracted data
      const validation = this.validateExtractedData(extractedData);
      warnings.push(...validation.warnings);

      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedData, validation);

      const result: ExtractedReceiptData = {
        ...extractedData,
        confidence,
        rawText: extractedText
      };

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        warnings,
        processingTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during receipt scanning',
        warnings: ['Processing failed - using fallback extraction'],
        processingTime: Date.now() - startTime
      };
    }
  }

  private async performOCR(imageFile: File): Promise<string> {
    // Use Tesseract.js or backend OCR service
    // This is a placeholder - actual implementation would use Tesseract
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // In production, this would call Tesseract.recognize()
          // For now, return placeholder
          resolve('OCR text extraction placeholder');
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageFile);
    });
  }

  private async extractDataWithAI(ocrText: string): Promise<Omit<ExtractedReceiptData, 'confidence' | 'rawText'>> {
    const prompt = `${this.PROFESSIONAL_RECEIPT_PROMPT}

Receipt Text:
"""
${ocrText}
"""

Extract the structured data and return only valid JSON:`;

    const response = await aiReasoningEngine.processRequest({
      message: prompt,
      userId: 'system'
    });

    try {
      // Extract JSON from AI response
      const jsonMatch = response.reasoning.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields are present
        return {
          merchant: parsed.merchant || 'Not Found',
          receipt_number: parsed.receipt_number || 'Not Found',
          date: parsed.date || 'Not Found',
          time: parsed.time || 'Not Found',
          items: Array.isArray(parsed.items) ? parsed.items.map((item: any) => ({
            name: item.name || 'Unknown Item',
            price: typeof item.price === 'number' ? item.price : 0,
            quantity: typeof item.quantity === 'number' ? item.quantity : 1
          })) : [],
          subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : 0,
          tax: typeof parsed.tax === 'number' ? parsed.tax : 0,
          discount: typeof parsed.discount === 'number' ? parsed.discount : 0,
          total: typeof parsed.total === 'number' ? parsed.total : 0,
          payment_method: parsed.payment_method || 'Not Found',
          currency: parsed.currency || 'USD',
          category: parsed.category || 'Other'
        };
      }
      
      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      console.error('AI extraction failed:', error);
      // Return fallback data
      return this.createFallbackData(ocrText);
    }
  }

  private createFallbackData(ocrText: string): Omit<ExtractedReceiptData, 'confidence' | 'rawText'> {
    // Use regex-based extraction as fallback
    const lines = ocrText.split('\n').filter(line => line.trim());
    
    // Try to find merchant (usually first or second line)
    const merchant = lines[0]?.trim() || 'Unknown Merchant';
    
    // Try to find total (usually contains "Total" or "Total Amount")
    let total = 0;
    for (const line of lines) {
      const totalMatch = line.match(/total[\s:]*([\d,.]+)/i);
      if (totalMatch) {
        total = parseFloat(totalMatch[1].replace(',', ''));
        break;
      }
    }

    // Try to find date
    let date = 'Not Found';
    for (const line of lines) {
      const dateMatch = line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
      if (dateMatch) {
        date = this.normalizeDate(dateMatch[1]);
        break;
      }
    }

    return {
      merchant,
      receipt_number: 'Not Found',
      date,
      time: 'Not Found',
      items: [],
      subtotal: total,
      tax: 0,
      discount: 0,
      total,
      payment_method: 'Not Found',
      currency: 'USD',
      category: 'Other'
    };
  }

  private normalizeDate(dateStr: string): string {
    // Convert various date formats to YYYY-MM-DD
    try {
      const cleaned = dateStr.replace(/[\/\.]/g, '-');
      const parts = cleaned.split('-');
      
      if (parts.length === 3) {
        const [part1, part2, rawPart3] = parts;
        let part3 = rawPart3;
        
        // Determine if it's DD-MM-YYYY or MM-DD-YYYY
        if (part3.length === 2) {
          part3 = '20' + part3; // Assume 21st century
        }
        
        // Try DD-MM-YYYY first (common in many countries)
        const day = parseInt(part1);
        const month = parseInt(part2);
        
        if (day <= 31 && month <= 12) {
          return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        }
      }
      
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  private validateExtractedData(data: any): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!data.merchant || data.merchant === 'Not Found') {
      warnings.push('Merchant name could not be determined');
    }

    if (!data.date || data.date === 'Not Found') {
      warnings.push('Purchase date could not be determined');
    }

    if (data.total === 0 || data.total === undefined) {
      warnings.push('Total amount appears to be missing');
    }

    if (!data.items || data.items.length === 0) {
      warnings.push('Individual items could not be extracted');
    }

    // Validate totals match
    if (data.items && data.items.length > 0) {
      const itemsTotal = data.items.reduce((sum: number, item: any) => 
        sum + (item.price * (item.quantity || 1)), 0
      );
      
      const expectedTotal = itemsTotal + (data.tax || 0) - (data.discount || 0);
      
      if (Math.abs(expectedTotal - data.total) > 0.01) {
        warnings.push('Total amount does not match sum of items');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  private calculateConfidence(data: any, validation: { isValid: boolean; warnings: string[] }): number {
    let score = 100;

    // Deduct points for missing critical fields
    if (!data.merchant || data.merchant === 'Not Found') score -= 20;
    if (!data.date || data.date === 'Not Found') score -= 15;
    if (!data.total || data.total === 0) score -= 20;
    if (!data.items || data.items.length === 0) score -= 10;
    if (data.currency === 'Not Found') score -= 5;
    if (data.payment_method === 'Not Found') score -= 5;

    // Deduct for validation warnings
    score -= validation.warnings.length * 5;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  // Process batch of receipts
  async processBatchReceipts(files: File[]): Promise<ReceiptScanResult[]> {
    const results: ReceiptScanResult[] = [];
    
    for (const file of files) {
      const result = await this.scanReceipt(file);
      results.push(result);
    }

    return results;
  }
}

export const enhancedReceiptScanner = new EnhancedReceiptScanner();
export default EnhancedReceiptScanner;
