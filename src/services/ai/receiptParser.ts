import Tesseract from 'tesseract.js';

export interface ReceiptItem {
  name: string;
  price: number;
  original_price: number;
  category: string;
}

export interface ParsedReceipt {
  merchant: string;
  date: string;
  currency: string;
  original_currency: string;
  payment_method: string;
  items: ReceiptItem[];
  tax: number;
  total: number;
  original_total: number;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

class ReceiptParser {
  private model: any = null;
  private currencyRates: Map<string, number> = new Map();
  
  constructor() {
    this.loadCurrencyRates();
  }

  private async initializeModel() {
    try {
      // Initialize a lightweight text classification model
      this.model = await create('pipeline', 'text-classification', 'distilbert-base-uncased');
    } catch (error) {
      console.warn('Failed to initialize AI model, falling back to rule-based parsing:', error);
    }
  }

  private loadCurrencyRates() {
    // Sample rates - in production, fetch from live API
    this.currencyRates.set('USD', 1.0);
    this.currencyRates.set('UGX', 0.00027);
    this.currencyRates.set('KES', 0.0078);
    this.currencyRates.set('EUR', 1.09);
    this.currencyRates.set('GBP', 1.27);
    this.currencyRates.set('TZS', 0.00039);
    this.currencyRates.set('RWF', 0.00081);
  }

  private detectCurrency(text: string): string {
    const currencyPatterns = {
      'UGX': /UGX|Ush|Ugx| Uganda Shillings?/i,
      'KES': /KES|Ksh|KSh| Kenya Shillings?/i,
      'USD': /\$|USD|US Dollar/i,
      'EUR': /€|EUR|Euro/i,
      'GBP': /£|GBP|Pound/i,
      'TZS': /TZS|Tsh|Tanzania Shillings?/i,
      'RWF': /RWF|Rwanda Franc/i
    };

    for (const [currency, pattern] of Object.entries(currencyPatterns)) {
      if (pattern.test(text)) {
        return currency;
      }
    }

    return 'USD'; // Default to USD
  }

  private extractMerchant(text: string): string {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Look for common merchant indicators
    const merchantPatterns = [
      /^(Shoprite|Woolworths|Nakumatt|Carrefour|Tesco|Walmart|Target|Costco)/i,
      /^(Restaurant|Cafe|Hotel|Bar|Pub)/i,
      /^(Gas|Petrol|Fuel)/i,
    ];

    for (const line of lines) {
      for (const pattern of merchantPatterns) {
        if (pattern.test(line)) {
          return line.trim();
        }
      }
    }

    // Return first non-empty line as fallback
    return lines[0] || 'Unknown Merchant';
  }

  private extractDate(text: string): string {
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
      /(\d{2}\/\d{2}\/\d{4})/, // MM/DD/YYYY
      /(\d{2}-\d{2}-\d{4})/, // DD-MM-YYYY
      /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i, // DD Month YYYY
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1];
        // Convert to YYYY-MM-DD format
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }

    return new Date().toISOString().split('T')[0]; // Default to today
  }

  private extractPaymentMethod(text: string): string {
    const paymentPatterns = {
      'Cash': /cash|paid in cash/i,
      'Visa': /visa|credit card.*visa/i,
      'Mastercard': /mastercard|credit card.*master/i,
      'Mobile Money': /mobile money|m-pesa|airtel money|tigo pesa/i,
      'Card': /card|credit|debit/i,
    };

    for (const [method, pattern] of Object.entries(paymentPatterns)) {
      if (pattern.test(text)) {
        return method;
      }
    }

    return 'Unknown';
  }

  private extractItems(text: string, currency: string): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    const lines = text.split('\n');
    
    // Look for item patterns (name + price)
    for (const line of lines) {
      // Pattern: Item name followed by price
      const itemMatch = line.match(/(.+?)\s+([\d,]+\.?\d*)\s*$/);
      if (itemMatch) {
        const name = itemMatch[1].trim();
        const price = parseFloat(itemMatch[2].replace(',', ''));
        
        if (name && price > 0 && !this.isTaxOrTotalLine(name)) {
          items.push({
            name,
            price: this.convertToUSD(price, currency),
            original_price: price,
            category: this.categorizeItem(name)
          });
        }
      }
    }

    return items;
  }

  private isTaxOrTotalLine(line: string): boolean {
    const taxTotalPatterns = [
      /tax|vat|gst/i,
      /total|sum|subtotal/i,
      /cash|change|balance/i,
      /^\s*[\d,.]+\s*$/, // Just numbers
    ];

    return taxTotalPatterns.some(pattern => pattern.test(line));
  }

  private categorizeItem(itemName: string): string {
    const categories = {
      'Grocery': /milk|bread|eggs|cheese|meat|fish|vegetables|fruits|rice|flour|sugar|salt|oil|butter|yogurt|cereal|pasta|tomato|onion|potato|garlic|pepper|spice|coffee|tea|juice|water|snacks|chips|cookies|candy|chocolate|ice cream/i,
      'Fuel': /gas|petrol|fuel|diesel|gasoline|oil|lubricant/i,
      'Meals': /restaurant|cafe|food|meal|breakfast|lunch|dinner|burger|pizza|sandwich|chicken|beef|pork|fish|salad|soup|dessert|drink|beer|wine|soda|coffee|tea/i,
      'Travel': /hotel|flight|taxi|uber|bus|train|ticket|parking|rental|airport|transport/i,
      'Utilities': /electric|water|gas|phone|internet|cable|tv|rent|mortgage|insurance|bank|fee|service/i,
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(itemName)) {
        return category;
      }
    }

    return 'Other';
  }

  private extractTax(text: string, currency: string): number {
    const taxPatterns = [
      /tax\s*[:=]?\s*([\d,]+\.?\d*)/i,
      /vat\s*[:=]?\s*([\d,]+\.?\d*)/i,
      /gst\s*[:=]?\s*([\d,]+\.?\d*)/i,
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        const taxAmount = parseFloat(match[1].replace(',', ''));
        return this.convertToUSD(taxAmount, currency);
      }
    }

    return 0;
  }

  private extractTotal(text: string, currency: string): number {
    const totalPatterns = [
      /total\s*[:=]?\s*([\d,]+\.?\d*)/i,
      /amount\s*[:=]?\s*([\d,]+\.?\d*)/i,
      /sum\s*[:=]?\s*([\d,]+\.?\d*)/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const totalAmount = parseFloat(match[1].replace(',', ''));
        return this.convertToUSD(totalAmount, currency);
      }
    }

    return 0;
  }

  private convertToUSD(amount: number, fromCurrency: string): number {
    const rate = this.currencyRates.get(fromCurrency) || 1.0;
    return parseFloat((amount * rate).toFixed(2));
  }

  async parseReceiptFromImage(imageFile: File): Promise<ParsedReceipt> {
    try {
      // Perform OCR on the image
      const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');
      
      return this.parseReceiptFromText(text);
    } catch (error) {
      console.error('OCR failed:', error);
      throw new Error('Failed to extract text from receipt image');
    }
  }

  async parseReceiptFromText(text: string): Promise<ParsedReceipt> {
    const originalCurrency = this.detectCurrency(text);
    
    const items = this.extractItems(text, originalCurrency);
    const tax = this.extractTax(text, originalCurrency);
    const total = this.extractTotal(text, originalCurrency);
    
    // Calculate original total from items if not found
    const originalTotal = total > 0 ? total : items.reduce((sum, item) => sum + item.original_price, 0) + tax;

    return {
      merchant: this.extractMerchant(text),
      date: this.extractDate(text),
      currency: 'USD',
      original_currency: originalCurrency,
      payment_method: this.extractPaymentMethod(text),
      items,
      tax,
      total: this.convertToUSD(originalTotal, originalCurrency),
      original_total: originalTotal
    };
  }
}

export const receiptParser = new ReceiptParser();
