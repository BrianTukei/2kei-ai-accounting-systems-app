import { localAIService } from './localAIService';
import { currencyService } from '../currencyService';
import { userCompanyService } from '../userCompanyService';

export interface AIExtractedReceipt {
  vendor: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  originalCurrency: string;
  paymentMethod: string;
  category: string;
  confidence: number;
  warnings: string[];
}

export interface ReceiptValidationResult {
  isValid: boolean;
  confidence: number;
  issues: Array<{
    type: 'duplicate' | 'unusual_amount' | 'missing_info' | 'fake_suspicion';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string;
  }>;
}

class AIReceiptScannerService {
  private categories = [
    'Office Supplies',
    'Transport',
    'Food & Dining',
    'Utilities',
    'Equipment',
    'Software',
    'Marketing',
    'Travel',
    'Entertainment',
    'Healthcare',
    'Insurance',
    'Rent',
    'Communication',
    'Professional Services',
    'Other'
  ];

  private systemPrompt = `You are an expert receipt analysis AI for 2K AI Accounting Systems.

Your job is to extract structured data from receipt text with high accuracy.

🎯 **Extraction Rules:**
- Extract vendor name (store/restaurant name)
- Extract date (normalize to YYYY-MM-DD format)
- Extract all items with names, prices, and quantities
- Calculate totals and tax
- Detect currency (USD, UGX, KES, TZS, RWF, etc.)
- Identify payment method (cash, card, mobile money)

🧾 **Receipt Types You Handle:**
- Supermarkets (Shoprite, Nakumatt, Carrefour, Woolworths)
- Restaurants and cafes
- Gas stations and fuel receipts
- Office supply stores
- Utility bills
- Service invoices
- Mobile money transactions

💱 **Currency Detection:**
- USD: $, USD, US Dollar
- UGX: UGX, Ush, Uganda Shillings
- KES: KES, Ksh, Kenya Shillings  
- TZS: TZS, Tsh, Tanzania Shillings
- RWF: RWF, Rwanda Francs
- EUR: €, EUR, Euro
- GBP: £, GBP, Pound

📊 **Data Quality:**
- Calculate confidence scores for each extraction
- Identify missing or ambiguous information
- Flag potential issues or anomalies
- Suggest corrections when possible

🔍 **Validation Checks:**
- Look for duplicate expenses
- Detect unusual amounts
- Verify mathematical calculations
- Check for fake or altered receipts

Always return structured JSON with high accuracy and confidence scoring.`;

  async extractReceiptData(receiptText: string, imagePath?: string): Promise<AIExtractedReceipt> {
    try {
      const prompt = `
${this.systemPrompt}

Extract structured data from this receipt text:

${receiptText}

Return JSON with this exact structure:
{
  "vendor": "store/restaurant name",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "item name",
      "price": number,
      "quantity": number,
      "category": "category from list"
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "currency": "USD",
  "originalCurrency": "detected currency",
  "paymentMethod": "cash|card|mobile_money|other",
  "category": "overall expense category",
  "confidence": 0.95,
  "warnings": ["any issues or concerns"]
}

Important:
- Use actual detected currency as originalCurrency
- Convert amounts to USD as currency
- Categorize each item appropriately
- Calculate confidence based on clarity of data
- Include any warnings about data quality`;

      const response = await localAIService.generateResponse(prompt, {
        temperature: 0.2, // Lower temperature for more consistent extraction
        max_tokens: 2000
      });

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        
        // Validate and enhance the extracted data
        return this.validateAndEnhanceReceipt(extracted, receiptText);
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Receipt extraction failed:', error);
      return this.getFallbackExtraction(receiptText);
    }
  }

  async categorizeExpense(receiptData: AIExtractedReceipt): Promise<string> {
    try {
      const prompt = `
${this.systemPrompt}

Categorize this expense into one of these categories:
${this.categories.join(', ')}

Receipt Data:
- Vendor: ${receiptData.vendor}
- Items: ${receiptData.items.map(item => item.name).join(', ')}
- Total: ${receiptData.total} ${receiptData.currency}
- Payment Method: ${receiptData.paymentMethod}

Return only the category name as a single word.`;

      const response = await localAIService.generateResponse(prompt, {
        temperature: 0.1,
        max_tokens: 50
      });

      const category = response.trim();
      return this.categories.includes(category) ? category : 'Other';
    } catch (error) {
      console.error('Categorization failed:', error);
      return 'Other';
    }
  }

  async validateReceipt(receiptData: AIExtractedReceipt, existingExpenses: any[] = []): Promise<ReceiptValidationResult> {
    const issues: ReceiptValidationResult['issues'] = [];
    let confidence = receiptData.confidence || 0.8;

    // Check for duplicates
    const duplicates = existingExpenses.filter(expense => 
      expense.vendor === receiptData.vendor &&
      expense.total === receiptData.total &&
      Math.abs(new Date(expense.date).getTime() - new Date(receiptData.date).getTime()) < 86400000 // 24 hours
    );

    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate',
        severity: 'high',
        description: `Potential duplicate expense found for ${receiptData.vendor}`,
        suggestion: 'Review existing expenses to confirm this is not a duplicate'
      });
      confidence -= 0.2;
    }

    // Check for unusual amounts
    if (receiptData.total > 1000) {
      issues.push({
        type: 'unusual_amount',
        severity: 'medium',
        description: `High amount detected: ${receiptData.total} ${receiptData.currency}`,
        suggestion: 'Verify this large expense is legitimate'
      });
      confidence -= 0.1;
    }

    // Check for missing information
    if (!receiptData.vendor || receiptData.vendor.length < 2) {
      issues.push({
        type: 'missing_info',
        severity: 'medium',
        description: 'Vendor name unclear or missing',
        suggestion: 'Manually verify the vendor name'
      });
      confidence -= 0.15;
    }

    if (!receiptData.date || receiptData.date === 'Invalid Date') {
      issues.push({
        type: 'missing_info',
        severity: 'high',
        description: 'Date could not be extracted',
        suggestion: 'Manually enter the receipt date'
      });
      confidence -= 0.25;
    }

    // Check for fake receipt indicators
    const suspiciousPatterns = [
      /test/i,
      /sample/i,
      /demo/i,
      /void/i,
      /cancelled/i
    ];

    const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
      pattern.test(receiptData.vendor) || 
      receiptData.items.some(item => pattern.test(item.name))
    );

    if (hasSuspiciousContent) {
      issues.push({
        type: 'fake_suspicion',
        severity: 'high',
        description: 'Receipt contains suspicious indicators',
        suggestion: 'Review receipt for authenticity - may be test/sample'
      });
      confidence -= 0.3;
    }

    return {
      isValid: confidence > 0.5 && issues.filter(i => i.severity === 'high').length === 0,
      confidence: Math.max(0, Math.min(1, confidence)),
      issues
    };
  }

  async detectDuplicateExpenses(newReceipt: AIExtractedReceipt, existingExpenses: any[]): Promise<any[]> {
    const potentialDuplicates = existingExpenses.filter(expense => {
      const sameVendor = expense.vendor?.toLowerCase() === newReceipt.vendor.toLowerCase();
      const sameAmount = Math.abs(expense.total - newReceipt.total) < 0.01; // Account for rounding
      const sameDate = Math.abs(new Date(expense.date).getTime() - new Date(newReceipt.date).getTime()) < 86400000; // 24 hours
      const sameCurrency = expense.currency === newReceipt.currency;

      return sameVendor && sameAmount && sameDate && sameCurrency;
    });

    return potentialDuplicates;
  }

  async analyzeExpensePatterns(expenses: any[]): Promise<{
    unusualSpending: Array<{
      description: string;
      amount: number;
      percentage: number;
    }>;
  trends: Array<{
    category: string;
    amount: number;
    change: number;
  }>;
  recommendations: string[];
  }> {
    try {
      const prompt = `
${this.systemPrompt}

Analyze these expenses for patterns and insights:

${JSON.stringify(expenses.slice(0, 50), null, 2)}

Provide:
1. Unusual spending patterns (amounts significantly higher than normal)
2. Category trends and changes
3. Cost-saving recommendations
4. Any concerning patterns

Return JSON:
{
  "unusualSpending": [
    {
      "description": "description of unusual spending",
      "amount": number,
      "percentage": number
    }
  ],
  "trends": [
    {
      "category": "category name",
      "amount": number,
      "change": number
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

      const response = await localAIService.generateResponse(prompt, {
        temperature: 0.3,
        max_tokens: 1500
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getFallbackPatternAnalysis(expenses);
    } catch (error) {
      console.error('Pattern analysis failed:', error);
      return this.getFallbackPatternAnalysis(expenses);
    }
  }

  private validateAndEnhanceReceipt(extracted: any, originalText: string): AIExtractedReceipt {
    // Ensure all required fields exist
    const receipt: AIExtractedReceipt = {
      vendor: extracted.vendor || 'Unknown Vendor',
      date: extracted.date || new Date().toISOString().split('T')[0],
      items: Array.isArray(extracted.items) ? extracted.items : [],
      subtotal: extracted.subtotal || 0,
      tax: extracted.tax || 0,
      total: extracted.total || 0,
      currency: extracted.currency || 'USD',
      originalCurrency: extracted.originalCurrency || 'USD',
      paymentMethod: extracted.paymentMethod || 'other',
      category: extracted.category || 'Other',
      confidence: extracted.confidence || 0.8,
      warnings: Array.isArray(extracted.warnings) ? extracted.warnings : []
    };

    // Validate items
    receipt.items = receipt.items.map(item => ({
      name: item.name || 'Unknown Item',
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      category: item.category || 'Other'
    }));

    // Calculate totals if missing
    if (receipt.subtotal === 0) {
      receipt.subtotal = receipt.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    if (receipt.total === 0) {
      receipt.total = receipt.subtotal + receipt.tax;
    }

    // Currency conversion if needed
    if (receipt.originalCurrency !== 'USD' && receipt.originalCurrency !== receipt.currency) {
      const convertedTotal = currencyService.convert(receipt.total, receipt.originalCurrency, 'USD');
      receipt.total = convertedTotal;
      receipt.currency = 'USD';
      
      // Convert item prices too
      receipt.items = receipt.items.map(item => ({
        ...item,
        price: currencyService.convert(item.price, receipt.originalCurrency, 'USD')
      }));
    }

    return receipt;
  }

  private getFallbackExtraction(receiptText: string): AIExtractedReceipt {
    // Basic regex-based fallback extraction
    const lines = receiptText.split('\n').filter(line => line.trim());
    
    return {
      vendor: lines[0] || 'Unknown Vendor',
      date: new Date().toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      currency: 'USD',
      originalCurrency: 'USD',
      paymentMethod: 'other',
      category: 'Other',
      confidence: 0.3,
      warnings: ['AI extraction failed - using fallback method', 'Manual review required']
    };
  }

  private getFallbackPatternAnalysis(expenses: any[]) {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.total;
      return acc;
    }, {} as Record<string, number>);

    const trends = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      change: 0 // No historical data for comparison
    }));

    return {
      unusualSpending: [],
      trends: trends.slice(0, 5),
      recommendations: [
        'Continue monitoring expenses regularly',
        'Consider setting up expense alerts',
        'Review high-value expenses for optimization'
      ]
    };
  }
}

export const aiReceiptScannerService = new AIReceiptScannerService();
