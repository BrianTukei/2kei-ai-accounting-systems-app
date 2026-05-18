import { localAIService } from './localAIService';

// Professional Accounting AI System Prompt for Llama 3
const ACCOUNTING_AI_SYSTEM_PROMPT = `You are the core intelligence of the 2K AI Accounting System, an advanced, elite-tier financial AI and Chief Financial Officer (CFO) proxy.

Your mandate is to provide world-class, unerring accounting, financial analysis, forecasting, global tax compliance, and business strategy management.

Knowledge Domains & Accounting Standards:
- Deep expertise in all major global accounting frameworks, including GAAP (US), IFRS (International), and major localized tax policies (UK HMRC, IRS, URA, KRA, SARS, etc.).
- Complete mastery of Double-Entry Bookkeeping, Cost Accounting, Managerial Accounting, Auditing, Corporate Finance, and Treasury Management.
- Ability to explain complex accounting rules (e.g., depreciation, amortization, accruals, deferrals, FIFO/LIFO, equity structures) effortlessly.

Your capabilities include:

1. Global Accounting Support & Compliance
Answer any accounting query, parse rules, and guide users on how to align with their local or global accounting standards (GAAP/IFRS). Offer audit-ready insights.

2. Receipt Processing & Automation
When receipt information is provided, extract:
- merchant name, date, total amount, tax amount, payment method, line items.
Then categorize the expense precisely based on standard charts of accounts (e.g., Office Supplies, Transport, Cost of Goods Sold, Capital Expenditure).

3. Advanced Transaction Categorization
Analyze transactions (multi-currency context) and accurately classify them, accounting for forex gains/losses and tax implications (VAT/GST).

4. Financial Explanation & Guidance
Translate sophisticated corporate finance concepts into actionable, clear language for businesses of any scale (sole traders to enterprise).

5. Reports, Projections, & Analytics
Provide advanced interpretative analysis for:
- general ledgers, trial balances, statements of cash flow
- P&L statements, balance sheets
- liquidity forecasting, unit economics, ROI analysis

6. Strategic CFO Advisery
Actively provide suggestions to optimize burn rate, boost profit margins, optimize tax liabilities legally, and manage working capital efficiently.

7. Smart Behavior
- Always be completely accurate and compliant.
- Never invent or hallucinate financial quantities or regulatory laws.
- Request missing parameters when dealing with ambiguous compliance questions.
- Address multi-currency or multi-tenant scenarios adeptly.

8. Response Format
Whenever resolving transactions or giving financial advice, structure responses thoughtfully:

Summary:
[High-level financial takeaway]

Implementation / Details:
[Detailed entry specs, Merchant, Amount, Date, Tax handling, Debits/Credits]

Strategic Insights:
[CFO-level insight: 'Consider depreciating this asset over 5 years.']

Remember: You are an omniscient financial brain, engineered to be the most capable automated accountant in existence, capable of answering *any* question regarding accounting standards, systems, or economic strategy.`;

export interface BackendAIRequest {
  model?: string;
  prompt: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface BackendAIResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ReceiptExtractionRequest {
  text: string;
  userId: string;
  companyId?: string;
}

export interface ExtractedReceiptData {
  vendor: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  total: number;
  currency: string;
  category: string;
  confidence?: number;
}

export interface ChatbotRequest {
  message: string;
  userId: string;
  companyId?: string;
  context?: any;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

class BackendAIService {
  private ollamaBaseUrl: string = 'http://localhost:11434';
  private defaultModel: string = 'llama3';

  private accountingSystemPrompt = ACCOUNTING_AI_SYSTEM_PROMPT;

  // Available Modules:
  // - Dashboard – Overview of financial activity and key metrics
  // - Invoices – Create and manage customer invoices  
  // - Expenses – Record and track business expenses and receipts
  // - Bills – Manage supplier bills and payments
  // - Reports – Generate financial reports and analytics
  // - Teams – Manage staff accounts and permissions
  // - Subscriptions – Manage payment plans and billing
  // - Settings – Configure company preferences and integrations

  // AI Capabilities:
  // - Receipt scanning with OCR and data extraction
  // - Automatic expense categorization
  // - Financial mistake detection
  // - Currency conversion (30+ currencies including UGX, KES, TZS, RWF)
  // - Multi-language support
  // - Real-time financial insights

  // Currency Features:
  // - Support for 30+ African and international currencies
  // - Automatic currency detection and conversion
  // - Real-time exchange rate updates
  // - Mobile money integration (M-Pesa, Airtel Money, etc.)

  // Your Responsibilities:
  // 1. Guide users to the correct modules for their tasks
  // 2. Provide step-by-step navigation instructions
  // 3. Help with receipt scanning and expense management
  // 4. Assist with invoice creation and bill payments
  // 5. Explain financial reports and analytics
  // 6. Support currency conversion and multi-currency transactions
  // 7. Provide troubleshooting and best practices

// Navigation Examples:
  // - "Where do I find reports?" → "Go to Dashboard → Reports → Select the report you want"
  // - "How do I add expenses?" → "Go to Expenses → Add Expense → Fill in details or scan receipt"
  // - "How do I create invoices?" → "Go to Invoices → Create Invoice → Add customer and items"

  // Communication Style:
  // - Professional, friendly, and helpful
  // - Provide clear, actionable steps
  // - Use module names exactly as shown above
  // - Include navigation paths (Module → Sub-module → Action)
  // - Ask clarifying questions when needed
  // - Suggest related features that might help

  // African Market Focus:
  // - Understand local business practices
  // - Support mobile money transactions
  // - Handle multiple African currencies
  // - Consider local regulations and compliance
  // - Provide relevant examples for African SMEs

  // Always provide specific navigation paths and actionable guidance to help users succeed with 2K AI Accounting Systems.';

  private receiptExtractionPrompt = `You are an expert receipt analysis AI for 2K AI Accounting Systems.

Your job is to extract structured financial data from receipt text with high accuracy.

Extraction Rules:
- Extract vendor name (store/restaurant name)
- Extract date (normalize to YYYY-MM-DD format)
- Extract all items with names and prices
- Calculate total amount
- Detect currency (USD, UGX, KES, TZS, RWF, EUR, GBP, etc.)
- Categorize the expense appropriately

Receipt Types You Handle:
- Supermarkets (Shoprite, Nakumatt, Carrefour, Woolworths)
- Restaurants and cafes
- Gas stations and fuel receipts
- Office supply stores
- Utility bills
- Service invoices
- Mobile money transactions

Currency Detection:
- USD: $, USD, US Dollar
- UGX: UGX, Ush, Uganda Shillings
- KES: KES, Ksh, Kenya Shillings  
- TZS: TZS, Tsh, Tanzania Shillings
- RWF: RWF, Rwanda Francs
- EUR: €, EUR, Euro
- GBP: £, GBP, Pound

Expense Categories:
- Office Supplies
- Transport
- Food
- Utilities
- Equipment
- Rent
- Subscriptions
- Other

Data Quality:
- Ensure mathematical accuracy
- Validate totals against item sums
- Handle missing information gracefully
- Provide confidence assessment

Always return valid JSON with the exact structure specified.`;

  async generateResponse(request: BackendAIRequest): Promise<BackendAIResponse> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          prompt: request.prompt,
          system: request.system || this.accountingSystemPrompt,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 2000,
          stream: false
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
      }

      const data: BackendAIResponse = await response.json();
      
      if (!data.response) {
        throw new Error('Empty response from Ollama');
      }

      return data;
    } catch (error) {
      console.error('Backend AI generation failed:', error);
      throw error;
    }
  }

  async extractReceiptData(request: ReceiptExtractionRequest): Promise<ExtractedReceiptData> {
    try {
      const prompt = `${this.receiptExtractionPrompt}

Analyze this receipt text and return structured accounting data:

${request.text}

Return the result in JSON format with this exact structure:
{
  "vendor": "store/restaurant name",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "item name",
      "price": number,
      "quantity": 1
    }
  ],
  "total": number,
  "currency": "USD",
  "category": "Office Supplies|Transport|Food|Utilities|Equipment|Rent|Subscriptions|Other",
  "confidence": 0.95
}

Important:
- Use the detected currency, default to USD if unclear
- Normalize date to YYYY-MM-DD format
- Calculate total from items if not provided
- Choose the most appropriate category
- Include confidence score (0.0 to 1.0)
- Ensure JSON is valid and complete`;

      const response = await this.generateResponse({
        prompt,
        temperature: 0.2, // Lower temperature for consistent extraction
        max_tokens: 1500
      });

      // Parse JSON response
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const extracted = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance the extracted data
      return this.validateReceiptData(extracted, request.text);
    } catch (error) {
      console.error('Receipt extraction failed:', error);
      throw new Error(`Failed to extract receipt data: ${error.message}`);
    }
  }

  async handleChatbotRequest(request: ChatbotRequest): Promise<string> {
    try {
      // Build conversation context
      let conversationPrompt = this.accountingSystemPrompt;

      if (request.conversationHistory && request.conversationHistory.length > 0) {
        conversationPrompt += '\n\n**Conversation History:**\n';
        request.conversationHistory.forEach(msg => {
          conversationPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
        });
      }

      conversationPrompt += `\n\n**Current User Question:**\n${request.message}`;

      if (request.context) {
        conversationPrompt += `\n\n**User Context:**\n${JSON.stringify(request.context, null, 2)}`;
      }

      conversationPrompt += '\n\n**Your Response:**\nProvide helpful guidance with specific navigation paths.';

      const response = await this.generateResponse({
        prompt: conversationPrompt,
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.response.trim();
    } catch (error) {
      console.error('Chatbot request failed:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact support if the issue persists.';
    }
  }

  async categorizeExpense(vendor: string, items: string[], amount: number): Promise<string> {
    try {
      const prompt = `${this.receiptExtractionPrompt}

Categorize this expense into one of these categories:
- Office Supplies
- Transport
- Food
- Utilities
- Equipment
- Rent
- Subscriptions
- Other

Expense Details:
- Vendor: ${vendor}
- Items: ${items.join(', ')}
- Amount: ${amount}

Return only the category name as a single word.`;

      const response = await this.generateResponse({
        prompt,
        temperature: 0.1,
        max_tokens: 50
      });

      const categories = ['Office Supplies', 'Transport', 'Food', 'Utilities', 'Equipment', 'Rent', 'Subscriptions', 'Other'];
      const category = response.response.trim();
      
      return categories.includes(category) ? category : 'Other';
    } catch (error) {
      console.error('Expense categorization failed:', error);
      return 'Other';
    }
  }

  async validateReceipt(receiptText: string): Promise<{
    isReadable: boolean;
    confidence: number;
    issues: string[];
  }> {
    try {
      const prompt = `${this.receiptExtractionPrompt}

Analyze this receipt text for readability and data quality:

${receiptText}

Check for:
- Text clarity and readability
- Missing critical information (vendor, date, total)
- Multiple or ambiguous totals
- Poor image quality indicators
- Suspicious or test content

Return JSON:
{
  "isReadable": true/false,
  "confidence": 0.85,
  "issues": ["issue1", "issue2"]
}`;

      const response = await this.generateResponse({
        prompt,
        temperature: 0.2,
        max_tokens: 500
      });

      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback assessment
      return {
        isReadable: receiptText.length > 50,
        confidence: 0.7,
        issues: []
      };
    } catch (error) {
      console.error('Receipt validation failed:', error);
      return {
        isReadable: false,
        confidence: 0.3,
        issues: ['Unable to validate receipt quality']
      };
    }
  }

  private validateReceiptData(extracted: any, originalText: string): ExtractedReceiptData {
    // Ensure all required fields exist
    const receipt: ExtractedReceiptData = {
      vendor: extracted.vendor || 'Unknown Vendor',
      date: extracted.date || new Date().toISOString().split('T')[0],
      items: Array.isArray(extracted.items) ? extracted.items.map(item => ({
        name: item.name || 'Unknown Item',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1
      })) : [],
      total: extracted.total || 0,
      currency: extracted.currency || 'USD',
      category: extracted.category || 'Other',
      confidence: extracted.confidence || 0.8
    };

    // Calculate total if missing or validate existing total
    const calculatedTotal = receipt.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (receipt.total === 0 || Math.abs(receipt.total - calculatedTotal) > 0.01) {
      receipt.total = calculatedTotal;
    }

    // Validate date format
    if (!receipt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      receipt.date = new Date().toISOString().split('T')[0];
    }

    // Validate category
    const validCategories = ['Office Supplies', 'Transport', 'Food', 'Utilities', 'Equipment', 'Rent', 'Subscriptions', 'Other'];
    if (!validCategories.includes(receipt.category)) {
      receipt.category = 'Other';
    }

    return receipt;
  }

  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Backend AI service not available:', error);
      return false;
    }
  }

  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }

  getServiceInfo(): {
    baseUrl: string;
    defaultModel: string;
    systemPrompt: string;
  } {
    return {
      baseUrl: this.ollamaBaseUrl,
      defaultModel: this.defaultModel,
      systemPrompt: this.accountingSystemPrompt
    };
  }
}

export const backendAIService = new BackendAIService();
