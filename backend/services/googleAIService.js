const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Google AI Service
 * Integrates Google Gemini API for intelligent financial analysis
 */
class GoogleAIService {
  constructor() {
    this.client = null;
    this.model = null;
    this.isReady = false;
    this.initialize();
  }

  /**
   * Initialize Google AI client
   */
  initialize() {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        logger.warn('GOOGLE_API_KEY not configured. Google AI features will be unavailable.');
        this.isReady = false;
        return;
      }

      this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      this.model = this.client.getGenerativeModel({
        model: 'gemini-1.5-pro'
      });

      this.isReady = true;
      logger.info('Google AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Google AI Service:', error.message);
      this.isReady = false;
    }
  }

  /**
   * Generic AI query handler
   * @param {string} prompt - The prompt to send to Gemini
   * @returns {Promise<string>} AI response
   */
  async query(prompt) {
    try {
      if (!this.isReady) {
        throw new Error('Google AI Service is not initialized. Configure GOOGLE_API_KEY in .env');
      }

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Google AI query failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract structured data from receipt OCR text
   * @param {string} receiptText - OCR extracted text from receipt
   * @returns {Promise<Object>} Structured receipt data
   */
  async parseReceipt(receiptText) {
    try {
      if (!this.isReady) {
        throw new Error('Google AI Service not available for receipt parsing');
      }

      const prompt = `
You are an expert accounting AI specialized in receipt parsing.

Extract structured financial data from this receipt OCR text and return ONLY valid JSON.

Return format (strict JSON):
{
  "vendor_name": "string or null",
  "receipt_number": "string or null",
  "date": "YYYY-MM-DD or null",
  "items": [{"name": "string", "quantity": number, "unit_price": number, "total": number}],
  "subtotal": number or null,
  "tax": number or null,
  "total": number,
  "currency": "string (e.g. UGX, USD, EUR)",
  "payment_method": "string or null (Cash, Card, Mobile Money, etc)",
  "category": "string (Sales, Expenses, Utilities, Transport, Rent, Salaries, Inventory, Tax, Insurance, Maintenance, Office Supplies, Other)",
  "notes": "string or null"
}

Rules:
- If a field is unavailable, use null
- Convert all monetary values to numbers
- Verify calculations: subtotal + tax = total (adjust if receipt has rounding)
- Detect currency from context (UGX, USD, EUR, etc)
- Always classify into one of the provided categories
- Return ONLY the JSON object, no additional text

Receipt OCR text:
${receiptText}`;

      const response = await this.query(prompt);
      
      // Parse JSON response
      let parsedData;
      try {
        parsedData = JSON.parse(response);
      } catch (parseError) {
        logger.warn('Failed to parse AI response as JSON, attempting extraction...');
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract valid JSON from AI response');
        }
      }

      // Validate receipt data
      this._validateReceiptData(parsedData);
      
      logger.info('Receipt parsed successfully', {
        vendor: parsedData.vendor_name,
        total: parsedData.total,
        category: parsedData.category
      });

      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      logger.error('Receipt parsing failed:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Analyze financial data with natural language query
   * @param {string} query - Natural language financial question
   * @param {Array} transactions - Transaction data
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeFinancials(query, transactions = []) {
    try {
      if (!this.isReady) {
        throw new Error('Google AI Service not available for financial analysis');
      }

      const transactionSummary = transactions.length > 0 
        ? JSON.stringify(transactions.slice(0, 50)) // Limit to prevent token overflow
        : 'No transactions available';

      const prompt = `
You are an expert financial analyst for an accounting system.

User Question: ${query}

Available Transaction Data (last 50):
${transactionSummary}

Provide a clear, professional financial analysis. Include:
- Direct answer to the question
- Key insights
- Recommendations if applicable
- Any anomalies detected

Keep response concise and business-friendly.`;

      const response = await this.query(prompt);

      logger.info('Financial analysis completed');

      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Financial analysis failed:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Generate professional email draft
   * @param {Object} emailConfig - Email configuration
   * @returns {Promise<Object>} Generated email
   */
  async generateEmail(emailConfig) {
    try {
      if (!this.isReady) {
        throw new Error('Google AI Service not available for email generation');
      }

      const {
        type = 'payment_reminder',
        recipientName = 'Client',
        amount = null,
        dueDate = null,
        companyName = '2K AI Accounting',
        tone = 'professional'
      } = emailConfig;

      const prompt = `
You are a professional business email writer.

Generate a ${type} email with the following details:
- Recipient: ${recipientName}
- Company: ${companyName}
- Tone: ${tone}
${amount ? `- Amount: ${amount}` : ''}
${dueDate ? `- Due Date: ${dueDate}` : ''}

Email types:
- payment_reminder: Polite payment reminder
- invoice_notification: Invoice delivery notification
- balance_alert: Account balance alert
- subscription_reminder: Subscription renewal reminder
- financial_update: Financial performance update

Return ONLY the email body (no subject line, no signature). Make it professional, clear, and actionable.`;

      const response = await this.query(prompt);

      logger.info('Email generated successfully', { type });

      return {
        success: true,
        data: {
          body: response,
          type: type
        }
      };
    } catch (error) {
      logger.error('Email generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Detect anomalies and fraud patterns
   * @param {Array} transactions - Transaction data
   * @returns {Promise<Object>} Anomaly detection results
   */
  async detectAnomalies(transactions) {
    try {
      if (!this.isReady) {
        throw new Error('Google AI Service not available for anomaly detection');
      }

      const prompt = `
You are a fraud detection expert for accounting systems.

Analyze these transactions for anomalies:
${JSON.stringify(transactions.slice(0, 100))}

Detect and report:
- Duplicate transactions
- Unusual spending patterns
- Negative balances
- Suspicious amounts
- Calculation inconsistencies
- Missing critical data

Return a JSON object:
{
  "anomalies_detected": boolean,
  "severity": "low|medium|high",
  "findings": [
    {
      "type": "string (duplicate, unusual_amount, negative_balance, etc)",
      "description": "string",
      "affected_transactions": [transaction_ids],
      "recommendation": "string"
    }
  ],
  "risk_score": number (0-100)
}

Be thorough but avoid false positives. Only flag genuine anomalies.`;

      const response = await this.query(prompt);

      let parsedResponse;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        parsedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      } catch {
        parsedResponse = { anomalies_detected: false, findings: [] };
      }

      logger.info('Anomaly detection completed', {
        anomalies_found: parsedResponse.anomalies_detected,
        severity: parsedResponse.severity
      });

      return {
        success: true,
        data: parsedResponse
      };
    } catch (error) {
      logger.error('Anomaly detection failed:', error.message);
      return {
        success: false,
        error: error.message,
        data: { anomalies_detected: false, findings: [] }
      };
    }
  }

  /**
   * Categorize transaction automatically
   * @param {string} description - Transaction description
   * @param {number} amount - Transaction amount
   * @returns {Promise<string>} Category
   */
  async categorizeTransaction(description, amount) {
    try {
      if (!this.isReady) {
        throw new Error('Google AI Service not available for categorization');
      }

      const categories = [
        'Sales', 'Expenses', 'Utilities', 'Transport', 'Rent',
        'Salaries', 'Inventory', 'Tax', 'Insurance', 'Maintenance',
        'Office Supplies', 'Other'
      ];

      const prompt = `
You are an accounting categorization expert.

Categorize this transaction into ONE of these categories:
${categories.join(', ')}

Transaction Description: "${description}"
Amount: ${amount}

Return ONLY the category name, nothing else.`;

      const response = await this.query(prompt);
      const category = response.trim();

      // Validate category
      const validCategory = categories.includes(category) ? category : 'Other';

      logger.info('Transaction categorized', { category: validCategory });

      return {
        success: true,
        category: validCategory
      };
    } catch (error) {
      logger.error('Transaction categorization failed:', error.message);
      return {
        success: false,
        category: 'Other',
        error: error.message
      };
    }
  }

  /**
   * Validate receipt data integrity
   * @private
   */
  _validateReceiptData(data) {
    // Verify calculations
    if (data.subtotal !== null && data.tax !== null && data.total !== null) {
      const calculatedTotal = data.subtotal + data.tax;
      const tolerance = 1; // Allow 1 unit difference for rounding
      
      if (Math.abs(calculatedTotal - data.total) > tolerance) {
        logger.warn('Receipt calculation mismatch detected', {
          subtotal: data.subtotal,
          tax: data.tax,
          calculated_total: calculatedTotal,
          actual_total: data.total
        });
      }
    }

    // Validate items if present
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.quantity > 0 && item.unit_price > 0) {
          const itemTotal = item.quantity * item.unit_price;
          if (Math.abs(itemTotal - item.total) > 0.5) {
            logger.warn('Item calculation mismatch', {
              item: item.name,
              expected: itemTotal,
              actual: item.total
            });
          }
        }
      }
    }
  }

  /**
   * Check if service is ready
   */
  isServiceReady() {
    return this.isReady;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      ready: this.isReady,
      model: this.isReady ? 'gemini-1.5-pro' : null,
      message: this.isReady 
        ? 'Google AI Service is operational'
        : 'Google AI Service requires GOOGLE_API_KEY in .env'
    };
  }
}

// Export singleton instance
module.exports = new GoogleAIService();
