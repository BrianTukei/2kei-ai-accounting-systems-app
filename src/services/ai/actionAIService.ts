import { fallbackAIService } from './fallbackAIService';
import { v4 as uuidv4 } from 'uuid';

export interface AIAction {
  action: string;
  parameters: Record<string, any>;
  confidence?: number;
  reasoning?: string;
}

export interface ActionResult {
  success: boolean;
  action: string;
  result?: any;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface FinancialInsight {
  type: 'overspending' | 'unpaid_invoices' | 'profit_trend' | 'unusual_expense' | 'cashflow_risk';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  amount?: number;
  percentage?: number;
  recommendation: string;
  data?: any;
}

const INVOICE_LS_KEY = '2kai-invoices';
const INVOICE_COUNTER_KEY = '2kai-invoice-counter';

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const toNumber = (value: any, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getNextInvoiceNumber = (): string => {
  const raw = localStorage.getItem(INVOICE_COUNTER_KEY);
  const next = raw ? Number.parseInt(raw, 10) + 1 : 100;
  localStorage.setItem(INVOICE_COUNTER_KEY, String(next));
  return `INV-${String(next).padStart(4, '0')}`;
};

const buildInvoiceItems = (params: any, amount: number) => {
  const rawItems = Array.isArray(params.items) ? params.items : [];

  const normalized = rawItems.map((item: any, index: number) => {
    const description = String(
      item?.description ?? item?.name ?? item?.item ?? `Item ${index + 1}`
    ).trim();
    const quantity = Math.max(1, toNumber(item?.quantity, 1));
    const unitPrice = Math.max(0, toNumber(item?.unitPrice ?? item?.price ?? item?.amount, 0));
    const total = roundMoney(quantity * unitPrice);
    return {
      id: uuidv4(),
      description,
      quantity,
      unitPrice,
      total
    };
  }).filter((item: any) => item.description);

  if (normalized.length > 0) {
    return normalized;
  }

  const safeAmount = Math.max(0, amount);
  return [
    {
      id: uuidv4(),
      description: String(params.description || 'Services').trim(),
      quantity: 1,
      unitPrice: safeAmount,
      total: roundMoney(safeAmount)
    }
  ];
};

const computeInvoiceTotals = (items: Array<{ total: number }>, taxRate: number, discount: number) => {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + (item.total || 0), 0));
  const taxAmount = roundMoney(subtotal * (taxRate / 100));
  const total = Math.max(0, roundMoney(subtotal + taxAmount - discount));
  return { subtotal, taxAmount, total };
};

class ActionAIService {
  private availableActions = [
    'create_invoice',
    'create_expense',
    'add_client',
    'generate_report',
    'scan_receipt',
    'view_financial_summary',
    'update_client',
    'delete_expense',
    'mark_invoice_paid',
    'add_bill',
    'pay_bill',
    'view_dashboard',
    'export_data',
    'set_reminder',
    'analyze_expenses',
    'forecast_revenue'
  ];

  private actionSystemPrompt = `You are the Action AI Assistant for 2K AI Accounting Systems.

Your role is to understand user requests and convert them into structured JSON commands that the system can execute.

🎯 **Available Actions:**
- create_invoice: Create a new invoice for a client
- create_expense: Add a new expense entry
- add_client: Add a new client to the system
- generate_report: Generate financial reports
- scan_receipt: Process a receipt image
- view_financial_summary: Show financial overview
- update_client: Update client information
- delete_expense: Remove an expense entry
- mark_invoice_paid: Mark an invoice as paid
- add_bill: Add a new bill to track
- pay_bill: Mark a bill as paid
- view_dashboard: Show dashboard overview
- export_data: Export financial data
- set_reminder: Set payment or deadline reminders
- analyze_expenses: Analyze spending patterns
- forecast_revenue: Predict future revenue

📋 **Action Parameters:**

 create_invoice:
 - client: string (client name)
 - amount: number (invoice amount)
 - description: string (optional, invoice details)
 - due_date: string (optional, YYYY-MM-DD)
 - items: array (optional, list of items with prices)
 - currency: string (optional, currency code like USD, EUR)
 - tax_rate: number (optional, percentage)
 - discount: number (optional)
 - issue_date: string (optional, YYYY-MM-DD)

create_expense:
- vendor: string (vendor name)
- amount: number (expense amount)
- category: string (expense category)
- date: string (optional, YYYY-MM-DD)
- description: string (optional, expense details)

add_client:
- name: string (client name)
- email: string (optional, client email)
- phone: string (optional, client phone)
- address: string (optional, client address)

generate_report:
- type: string (report type: profit_loss, balance_sheet, cash_flow, expense_summary)
- start_date: string (optional, YYYY-MM-DD)
- end_date: string (optional, YYYY-MM-DD)

scan_receipt:
- file_path: string (path to receipt image)
- category: string (optional, suggested category)

view_financial_summary:
- period: string (optional, daily, weekly, monthly, yearly)
- start_date: string (optional, YYYY-MM-DD)
- end_date: string (optional, YYYY-MM-DD)

🧠 **Response Format:**

For action requests, return ONLY JSON:
{
  "action": "action_name",
  "parameters": {
    "parameter": "value"
  },
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this action was chosen"
}

For questions or information requests, respond normally with helpful text.

💡 **Examples:**

User: "Create an invoice for John for $300"
Response: {"action": "create_invoice", "parameters": {"client": "John", "amount": 300}, "confidence": 0.95}

User: "Add expense for office supplies $50"
Response: {"action": "create_expense", "parameters": {"vendor": "Office Supplies Store", "amount": 50, "category": "Office Supplies"}, "confidence": 0.90}

User: "Where do I find reports?"
Response: Go to Dashboard → Reports → Select the report you want to view.

User: "Show me my financial summary"
Response: {"action": "view_financial_summary", "parameters": {"period": "monthly"}, "confidence": 0.85}

⚠️ **Important Rules:**
- Only return JSON for clear action requests
- Include confidence score (0.0 to 1.0)
- Add reasoning for complex requests
- Handle ambiguous parameters gracefully
- Ask for clarification if needed
- Never invent unavailable actions`;

  private financialAnalysisPrompt = `You are a financial analysis AI for 2K AI Accounting Systems.

Analyze financial data and provide actionable insights for small business owners.

📊 **Analysis Types:**
- Overspending detection
- Unpaid invoice tracking
- Profit trend analysis
- Unusual expense identification
- Cashflow risk assessment

💡 **Insight Categories:**
- overspending: Spending significantly above normal
- unpaid_invoices: Outstanding customer payments
- profit_trend: Profit increase/decrease patterns
- unusual_expense: Abnormal transaction amounts
- cashflow_risk: Potential cash flow problems

🔍 **Data to Analyze:**
- Revenue and expense trends
- Invoice payment status
- Expense category breakdown
- Cash flow patterns
- Seasonal variations

📋 **Response Format:**
Return JSON array of insights:
[
  {
    "type": "insight_type",
    "severity": "low|medium|high",
    "title": "Brief, clear title",
    "description": "Detailed explanation",
    "amount": number (if applicable),
    "percentage": number (if applicable),
    "recommendation": "Actionable suggestion",
    "data": {} (supporting data)
  }
]

🎯 **Focus Areas:**
- Practical advice for small businesses
- Clear, non-technical language
- Actionable recommendations
- African market considerations
- SME-specific insights`;

  async processUserMessage(message: string, userId: string, context?: any): Promise<{
    isAction: boolean;
    action?: AIAction;
    response?: string;
    confidence: number;
  }> {
    try {
      // Check if AI service is available
      const isAvailable = await fallbackAIService.isServiceAvailable();
      if (!isAvailable) {
        return {
          isAction: false,
          response: 'AI service is currently unavailable. Please try again later.',
          confidence: 0
        };
      }

      // Build context-aware prompt
      let prompt = this.actionSystemPrompt;
      
      if (context) {
        prompt += `\n\n**Current Context:**\n${JSON.stringify(context, null, 2)}`;
      }

      prompt += `\n\n**User Request:**\n${message}`;

      // Get AI response
      const response = await fallbackAIService.generateResponse(prompt);

      const aiOutput = response.response.trim();

      // Try to parse as JSON action
      try {
        const actionData = JSON.parse(aiOutput);
        
        if (actionData.action && this.availableActions.includes(actionData.action)) {
          return {
            isAction: true,
            action: {
              action: actionData.action,
              parameters: actionData.parameters || {},
              confidence: actionData.confidence || 0.8,
              reasoning: actionData.reasoning
            },
            confidence: actionData.confidence || 0.8
          };
        }
      } catch (parseError) {
        // Not JSON, treat as normal response
      }

      // Return as normal chatbot response
      return {
        isAction: false,
        response: aiOutput,
        confidence: 0.7
      };

    } catch (error) {
      console.error('Action AI processing failed:', error);
      return {
        isAction: false,
        response: 'I apologize, but I had trouble processing your request. Please try again.',
        confidence: 0
      };
    }
  }

  async executeAction(action: AIAction, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      const startTime = Date.now();
      let result: ActionResult;

      switch (action.action) {
        case 'create_invoice':
          result = await this.createInvoice(action.parameters, userId, companyId);
          break;
        case 'create_expense':
          result = await this.createExpense(action.parameters, userId, companyId);
          break;
        case 'add_client':
          result = await this.addClient(action.parameters, userId, companyId);
          break;
        case 'generate_report':
          result = await this.generateReport(action.parameters, userId, companyId);
          break;
        case 'view_financial_summary':
          result = await this.viewFinancialSummary(action.parameters, userId, companyId);
          break;
        case 'scan_receipt':
          result = await this.scanReceipt(action.parameters, userId, companyId);
          break;
        case 'analyze_expenses':
          result = await this.analyzeExpenses(action.parameters, userId, companyId);
          break;
        default:
          result = {
            success: false,
            action: action.action,
            error: `Action '${action.action}' is not yet implemented`,
            timestamp: new Date().toISOString()
          };
      }

      const processingTime = Date.now() - startTime;
      console.log(`Action '${action.action}' executed in ${processingTime}ms`);

      return result;

    } catch (error) {
      console.error(`Action execution failed for '${action.action}':`, error);
      return {
        success: false,
        action: action.action,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async createInvoice(params: any, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      // Validate required parameters
      if (!params.client || !params.amount) {
        return {
          success: false,
          action: 'create_invoice',
          error: 'Client name and amount are required',
          timestamp: new Date().toISOString()
        };
      }

      const amount = toNumber(params.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return {
          success: false,
          action: 'create_invoice',
          error: 'Invoice amount must be a positive number',
          timestamp: new Date().toISOString()
        };
      }

      if (typeof localStorage === 'undefined') {
        return {
          success: false,
          action: 'create_invoice',
          error: 'Invoice storage is unavailable in this environment',
          timestamp: new Date().toISOString()
        };
      }
      const taxRate = Math.max(0, toNumber(params.tax_rate ?? params.taxRate, 0));
      const discount = Math.max(0, toNumber(params.discount, 0));
      const currency = String(params.currency || params.currency_code || 'USD').toUpperCase();
      const issueDate = String(params.issue_date || params.issueDate || new Date().toISOString().split('T')[0]);
      const dueDate = String(
        params.due_date || params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      const items = buildInvoiceItems(params, amount);
      const { subtotal, taxAmount, total } = computeInvoiceTotals(items, taxRate, discount);

      const invoice = {
        id: uuidv4(),
        invoiceNumber: getNextInvoiceNumber(),
        clientName: String(params.client).trim(),
        clientEmail: String(params.clientEmail || params.email || '').trim(),
        clientAddress: String(params.clientAddress || params.address || '').trim(),
        issueDate,
        dueDate,
        status: 'draft',
        items,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        notes: String(params.notes || params.description || '').trim(),
        currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
        companyId
      };

      const stored = localStorage.getItem(INVOICE_LS_KEY);
      const invoices = stored ? JSON.parse(stored) : [];
      invoices.unshift(invoice);
      localStorage.setItem(INVOICE_LS_KEY, JSON.stringify(invoices));

      return {
        success: true,
        action: 'create_invoice',
        result: invoice,
        message: `✅ Invoice created for ${invoice.clientName} — ${currency} ${total.toLocaleString()}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        action: 'create_invoice',
        error: `Failed to create invoice: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async createExpense(params: any, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      // Validate required parameters
      if (!params.vendor || !params.amount) {
        return {
          success: false,
          action: 'create_expense',
          error: 'Vendor and amount are required',
          timestamp: new Date().toISOString()
        };
      }

      // Create expense
      const expense = {
        id: `exp-${Date.now()}`,
        vendor: params.vendor,
        amount: parseFloat(params.amount),
        category: params.category || 'Other',
        date: params.date || new Date().toISOString().split('T')[0],
        description: params.description || `Expense at ${params.vendor}`,
        userId,
        companyId,
        createdAt: new Date().toISOString()
      };

      // Simulate database save
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      expenses.push(expense);
      localStorage.setItem('expenses', JSON.stringify(expenses));

      return {
        success: true,
        action: 'create_expense',
        result: expense,
        message: `✅ Expense created: ${params.vendor} - $${params.amount}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        action: 'create_expense',
        error: `Failed to create expense: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async addClient(params: any, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      if (!params.name) {
        return {
          success: false,
          action: 'add_client',
          error: 'Client name is required',
          timestamp: new Date().toISOString()
        };
      }

      const client = {
        id: `client-${Date.now()}`,
        name: params.name,
        email: params.email || '',
        phone: params.phone || '',
        address: params.address || '',
        userId,
        companyId,
        createdAt: new Date().toISOString()
      };

      const clients = JSON.parse(localStorage.getItem('clients') || '[]');
      clients.push(client);
      localStorage.setItem('clients', JSON.stringify(clients));

      return {
        success: true,
        action: 'add_client',
        result: client,
        message: `✅ Client added: ${params.name}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        action: 'add_client',
        error: `Failed to add client: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async generateReport(params: any, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      const reportType = params.type || 'profit_loss';
      const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = params.end_date || new Date().toISOString().split('T')[0];

      // Generate mock report data
      const report = {
        id: `report-${Date.now()}`,
        type: reportType,
        startDate,
        endDate,
        data: this.generateMockReportData(reportType),
        userId,
        companyId,
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        action: 'generate_report',
        result: report,
        message: `✅ ${reportType.replace('_', ' ').toUpperCase()} report generated`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        action: 'generate_report',
        error: `Failed to generate report: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async viewFinancialSummary(params: any, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      const period = params.period || 'monthly';
      
      // Get financial data
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]').filter((e: any) => e.userId === userId);
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]').filter((i: any) => i.userId === userId);

      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalRevenue = invoices.reduce((sum: number, i: any) => sum + i.amount, 0);
      const netProfit = totalRevenue - totalExpenses;

      const summary = {
        period,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0,
        expenseCount: expenses.length,
        invoiceCount: invoices.length,
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        action: 'view_financial_summary',
        result: summary,
        message: `✅ Financial summary for ${period} period`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        action: 'view_financial_summary',
        error: `Failed to generate financial summary: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async scanReceipt(params: any, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      // This would integrate with the receipt scanner service
      return {
        success: true,
        action: 'scan_receipt',
        result: { message: 'Receipt scanner initiated' },
        message: '📷 Receipt scanner ready - Please upload your receipt image',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        action: 'scan_receipt',
        error: `Failed to start receipt scanner: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async analyzeExpenses(params: any, userId: string, companyId?: string): Promise<ActionResult> {
    try {
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]').filter((e: any) => e.userId === userId);
      
      // Generate insights
      const insights = this.generateExpenseInsights(expenses);

      return {
        success: true,
        action: 'analyze_expenses',
        result: insights,
        message: `✅ Expense analysis complete - Found ${insights.length} insights`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        action: 'analyze_expenses',
        error: `Failed to analyze expenses: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeFinancialData(data: any, userId: string): Promise<FinancialInsight[]> {
    try {
      const prompt = `${this.financialAnalysisPrompt}

Analyze this financial data:

${JSON.stringify(data, null, 2)}

Provide actionable insights for the business owner.`;

      const response = await fallbackAIService.generateResponse(prompt);

      // Parse JSON insights
      try {
        const jsonMatch = response.response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('Failed to parse insights JSON');
      }

      // Fallback insights
      return this.generateFallbackInsights(data);

    } catch (error) {
      console.error('Financial analysis failed:', error);
      return [];
    }
  }

  private generateMockReportData(reportType: string): any {
    switch (reportType) {
      case 'profit_loss':
        return {
          revenue: 15000,
          expenses: 8200,
          netProfit: 6800,
          profitMargin: 45.3
        };
      case 'balance_sheet':
        return {
          assets: 25000,
          liabilities: 8000,
          equity: 17000
        };
      case 'cash_flow':
        return {
          operatingCashFlow: 5000,
          investingCashFlow: -2000,
          financingCashFlow: 1000,
          netCashFlow: 4000
        };
      default:
        return {};
    }
  }

  private generateExpenseInsights(expenses: any[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    
    // Check for high expenses
    const highExpenses = expenses.filter((e: any) => e.amount > 1000);
    if (highExpenses.length > 0) {
      insights.push({
        type: 'unusual_expense',
        severity: 'medium',
        title: 'High-Value Expenses Detected',
        description: `Found ${highExpenses.length} expenses over $1,000`,
        amount: highExpenses.reduce((sum, e) => sum + e.amount, 0),
        recommendation: 'Review these large expenses for accuracy and necessity'
      });
    }

    return insights;
  }

  private generateFallbackInsights(data: any): FinancialInsight[] {
    return [
      {
        type: 'profit_trend',
        severity: 'low',
        title: 'Financial Overview',
        description: 'Your business is performing adequately',
        recommendation: 'Continue monitoring expenses and revenue trends'
      }
    ];
  }

  getAvailableActions(): string[] {
    return [...this.availableActions];
  }

  getServiceInfo(): {
    availableActions: string[];
    systemPrompt: string;
    capabilities: string[];
  } {
    return {
      availableActions: this.availableActions,
      systemPrompt: this.actionSystemPrompt,
      capabilities: [
        'Natural language understanding',
        'Action extraction from user messages',
        'Financial data analysis',
        'Automated task execution',
        'Error handling and validation',
        'Context-aware responses'
      ]
    };
  }
}

export const actionAIService = new ActionAIService();
