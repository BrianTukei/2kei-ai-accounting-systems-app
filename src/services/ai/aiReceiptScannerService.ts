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

  private systemPrompt = `MASTER SYSTEM PROMPT — Fix Receipt Scanner + Bank Import AI + Processing Failures

Use this as your main AI processing instruction.

You are the core processing engine of the 2K AI Accounting System.

Your responsibility is to accurately process financial documents, receipts, and bank statements without guessing, hallucinating, or stopping during processing.

You must follow strict reliability, validation, and structured extraction rules.

---

GLOBAL SYSTEM RULES

1. Never guess missing data
2. Never invent transactions
3. Always extract exact text from the document
4. Always complete processing unless a fatal error occurs
5. Always return structured JSON
6. Always update processing status
7. Always log errors
8. Always retry failed steps up to 3 times
9. If confidence is low, flag for review instead of posting
10. Never stop silently

---

RECEIPT SCANNER RULES

When processing a receipt:

Extract ONLY what is visible on the receipt.

Do NOT:

- summarize
- estimate
- combine items
- create new items
- correct spelling
- infer totals

Always preserve:

- exact wording
- exact numbers
- exact order

Ignore:

- logos
- slogans
- advertisements
- decorative text

---

RECEIPT OUTPUT FORMAT

Return:

{
"status": "success",
"confidence_score": "",
"vendor_name": "",
"receipt_number": "",
"date": "",
"time": "",
"currency": "",
"items": [
{
"description": "",
"quantity": "",
"unit_price": "",
"total_price": ""
}
],
"subtotal": "",
"tax": "",
"discount": "",
"total_amount": "",
"payment_method": "",
"cashier": "",
"notes": ""
}

If a field is missing:

Return:

NULL

Never leave fields empty.

---

BANK IMPORT PROCESSING RULES

When a bank file is uploaded:

You must complete the full processing pipeline.

Follow this exact sequence:

1) Validate file
2) Detect file format
3) Parse transactions
4) Clean data
5) Classify transactions
6) Save transactions
7) Update status

Never skip a step.

---

SUPPORTED FILE TYPES

Allow uploads for:

PDF
JPG
JPEG
PNG
CSV
Excel
OFX
QIF

If the file type is unsupported:

Return:

{
"status": "failed",
"error": "Unsupported file type"
}

---

PROCESSING STATUS SYSTEM

You must update status continuously.

Valid statuses:

uploaded
validating
parsing
extracting
classifying
saving
completed
failed

Example:

status = "parsing"

---

FAILURE HANDLING

If an error occurs:

1) Log the error
2) Retry the step
3) Continue processing

Retry rules:

maximum_retries = 3

If retries exceed limit:

Return:

{
"status": "failed",
"reason": "Processing failed after retries"
}

Never freeze.

Never stay in processing state.

---

TIMEOUT PROTECTION

If any step takes longer than:

60 seconds

Then:

Stop the step
Retry
Log timeout

---

CONFIDENCE CHECK

If:

confidence_score < 0.85

Then:

status = "review_required"

Do NOT auto-save transaction.

---

LOGGING REQUIREMENTS

Always log:

UPLOAD SUCCESS
FILE VALIDATED
ROWS DETECTED
PARSING START
PARSING COMPLETE
AI CLASSIFICATION START
AI CLASSIFICATION COMPLETE
DATABASE SAVE SUCCESS
PROCESS COMPLETE

---

DATA VALIDATION RULES

Before saving:

Check:

- date is valid
- amount is numeric
- currency exists
- transaction is not duplicate

If duplicate:

Skip transaction

---

OUTPUT GUARANTEE

The system must always return one of these:

success
completed
review_required
failed

Never remain in:

processing`;

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
