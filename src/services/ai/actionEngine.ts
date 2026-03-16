// Action Engine - AI Controls the Software
// Advanced AI SaaS Action Execution for 2K AI Accounting Systems

import { AIAction } from './aiReasoningEngine';

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
  executedAt: string;
}

export interface InvoiceData {
  client: string;
  amount: number;
  dueDate?: string;
  description?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface ExpenseData {
  vendor: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  receipt?: string;
}

export interface ReportData {
  type: 'profit_loss' | 'cash_flow' | 'expense_summary' | 'client_aging';
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'pdf' | 'excel';
}

export interface ClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export class ActionEngine {
  constructor() {
    this.initializeActionEngine();
  }

  private initializeActionEngine() {
    console.log('⚡ Action Engine initialized - AI can now control the software');
  }

  async executeAction(action: AIAction): Promise<ActionResult> {
    try {
      console.log(`🎯 Executing AI action: ${action.type} with confidence ${action.confidence}`);

      switch (action.type) {
        case 'create_invoice':
          return await this.createInvoice(action.parameters);
        
        case 'create_expense':
          return await this.createExpense(action.parameters);
        
        case 'generate_report':
          return await this.generateReport(action.parameters);
        
        case 'scan_receipt':
          return await this.scanReceipt(action.parameters);
        
        case 'update_client':
          return await this.updateClient(action.parameters);
        
        case 'send_reminder':
          return await this.sendReminder(action.parameters);
        
        case 'analyze_financials':
          return await this.analyzeFinancials(action.parameters);
        
        default:
          return {
            success: false,
            error: `Unknown action type: ${action.type}`,
            message: 'AI requested an unknown action',
            executedAt: new Date().toISOString()
          };
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to execute AI action',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Invoice Actions
  private async createInvoice(params: any): Promise<ActionResult> {
    try {
      const invoiceData: InvoiceData = {
        client: params.client || params.clientName,
        amount: params.amount || params.total,
        dueDate: params.dueDate || this.getDefaultDueDate(),
        description: params.description || params.service,
        items: params.items || []
      };

      // Validate required fields
      if (!invoiceData.client || !invoiceData.amount) {
        throw new Error('Client name and amount are required');
      }

      // In production, save to database
      const invoice = {
        id: this.generateId(),
        ...invoiceData,
        status: 'draft',
        createdAt: new Date().toISOString(),
        createdBy: 'AI'
      };

      console.log(`📄 AI created invoice for ${invoiceData.client}: $${invoiceData.amount}`);

      return {
        success: true,
        data: invoice,
        message: `Invoice created successfully for ${invoiceData.client}`,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create invoice',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Expense Actions
  private async createExpense(params: any): Promise<ActionResult> {
    try {
      const expenseData: ExpenseData = {
        vendor: params.vendor || params.merchant || params.store,
        amount: params.amount || params.total,
        category: params.category || this.categorizeExpense(params.description || ''),
        date: params.date || new Date().toISOString().split('T')[0],
        description: params.description || params.note,
        receipt: params.receipt || params.receiptImage
      };

      // Validate required fields
      if (!expenseData.vendor || !expenseData.amount) {
        throw new Error('Vendor and amount are required');
      }

      // In production, save to database
      const expense = {
        id: this.generateId(),
        ...expenseData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: 'AI'
      };

      console.log(`💸 AI created expense for ${expenseData.vendor}: $${expenseData.amount}`);

      return {
        success: true,
        data: expense,
        message: `Expense created successfully for ${expenseData.vendor}`,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create expense',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Report Actions
  private async generateReport(params: any): Promise<ActionResult> {
    try {
      const reportData: ReportData = {
        type: params.type || 'profit_loss',
        startDate: params.startDate || this.getDefaultStartDate(),
        endDate: params.endDate || new Date().toISOString().split('T')[0],
        format: params.format || 'json'
      };

      // In production, generate real report from database
      const report = {
        id: this.generateId(),
        ...reportData,
        generatedAt: new Date().toISOString(),
        generatedBy: 'AI',
        data: this.generateMockReportData(reportData.type)
      };

      console.log(`📊 AI generated ${reportData.type} report`);

      return {
        success: true,
        data: report,
        message: `${reportData.type} report generated successfully`,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate report',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Receipt Scanning Actions
  private async scanReceipt(params: any): Promise<ActionResult> {
    try {
      const receiptImage = params.image || params.receiptImage || params.file;
      
      if (!receiptImage) {
        throw new Error('Receipt image is required');
      }

      // In production, integrate with OCR service
      const scannedData = {
        id: this.generateId(),
        vendor: params.vendor || 'Unknown Vendor',
        amount: params.amount || 0,
        date: params.date || new Date().toISOString().split('T')[0],
        items: params.items || [],
        category: params.category || 'Other',
        confidence: params.confidence || 0.8,
        scannedAt: new Date().toISOString(),
        scannedBy: 'AI'
      };

      console.log(`🧾 AI scanned receipt for ${scannedData.vendor}: $${scannedData.amount}`);

      return {
        success: true,
        data: scannedData,
        message: `Receipt scanned successfully for ${scannedData.vendor}`,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to scan receipt',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Client Management Actions
  private async updateClient(params: any): Promise<ActionResult> {
    try {
      const clientData: ClientData = {
        name: params.name || params.clientName,
        email: params.email,
        phone: params.phone,
        address: params.address,
        taxId: params.taxId || params.vatNumber
      };

      if (!clientData.name) {
        throw new Error('Client name is required');
      }

      // In production, update database
      const client = {
        id: params.id || this.generateId(),
        ...clientData,
        updatedAt: new Date().toISOString(),
        updatedBy: 'AI'
      };

      console.log(`👥 AI updated client: ${clientData.name}`);

      return {
        success: true,
        data: client,
        message: `Client ${clientData.name} updated successfully`,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update client',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Reminder Actions
  private async sendReminder(params: any): Promise<ActionResult> {
    try {
      const clientId = params.clientId || params.client;
      const reminderType = params.type || 'payment';
      const message = params.message || this.generateReminderMessage(reminderType);

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // In production, send actual email/SMS
      const reminder = {
        id: this.generateId(),
        clientId,
        type: reminderType,
        message,
        sentAt: new Date().toISOString(),
        sentBy: 'AI',
        status: 'sent'
      };

      console.log(`📧 AI sent ${reminderType} reminder to client ${clientId}`);

      return {
        success: true,
        data: reminder,
        message: `Reminder sent successfully to client`,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to send reminder',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Financial Analysis Actions
  private async analyzeFinancials(params: any): Promise<ActionResult> {
    try {
      const analysisType = params.type || 'overview';
      const period = params.period || 'monthly';

      // In production, perform real financial analysis
      const analysis = {
        id: this.generateId(),
        type: analysisType,
        period,
        insights: this.generateFinancialInsights(analysisType),
        recommendations: this.generateFinancialRecommendations(),
        analyzedAt: new Date().toISOString(),
        analyzedBy: 'AI'
      };

      console.log(`📈 AI performed ${analysisType} financial analysis`);

      return {
        success: true,
        data: analysis,
        message: `Financial analysis completed successfully`,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to analyze financials',
        executedAt: new Date().toISOString()
      };
    }
  }

  // Helper Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  }

  private getDefaultStartDate(): string {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    return startDate.toISOString().split('T')[0];
  }

  private categorizeExpense(description: string): string {
    const categories = {
      'Office Supplies': ['office', 'supplies', 'stationery', 'printer'],
      'Transport': ['transport', 'travel', 'fuel', 'gas', 'taxi', 'uber'],
      'Food': ['food', 'restaurant', 'meal', 'coffee', 'lunch'],
      'Utilities': ['electricity', 'water', 'internet', 'phone', 'rent'],
      'Equipment': ['equipment', 'software', 'hardware', 'computer'],
      'Marketing': ['marketing', 'advertising', 'promotion', 'social media'],
      'Professional Services': ['legal', 'accounting', 'consulting', 'fees']
    };

    const desc = description.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  private generateMockReportData(type: string): any {
    switch (type) {
      case 'profit_loss':
        return {
          revenue: 15000,
          expenses: 8500,
          profit: 6500,
          profitMargin: 43.3,
          period: 'March 2024'
        };
      case 'cash_flow':
        return {
          openingBalance: 10000,
          inflow: 15000,
          outflow: 8500,
          closingBalance: 16500,
          netCashFlow: 6500
        };
      case 'expense_summary':
        return {
          totalExpenses: 8500,
          categories: {
            'Office Supplies': 1200,
            'Transport': 800,
            'Food': 600,
            'Utilities': 2000,
            'Other': 3900
          }
        };
      case 'client_aging':
        return {
          totalOutstanding: 2500,
          aging: {
            '0-30 days': 1500,
            '31-60 days': 800,
            '61-90 days': 200,
            '90+ days': 0
          }
        };
      default:
        return {};
    }
  }

  private generateReminderMessage(type: string): string {
    const messages = {
      'payment': 'This is a friendly reminder that your invoice is due soon. Please make your payment at your earliest convenience.',
      'overdue': 'Your invoice is now overdue. Please contact us to arrange payment.',
      'followup': 'Just following up on your recent invoice. Please let us know if you have any questions.'
    };

    return messages[type] || messages.payment;
  }

  private generateFinancialInsights(type: string): string[] {
    const insights = {
      'overview': [
        'Revenue increased by 15% compared to last month',
        'Expenses are within budget targets',
        'Profit margin is healthy at 43%'
      ],
      'cashflow': [
        'Cash flow is positive and growing',
        'Accounts receivable is well managed',
        'Operating expenses are under control'
      ],
      'expenses': [
        'Office supplies category shows 20% increase',
        'Transport costs are stable',
        'Utilities expenses are seasonal as expected'
      ]
    };

    return insights[type] || insights.overview;
  }

  private generateFinancialRecommendations(): string[] {
    return [
      'Consider negotiating better terms with suppliers',
      'Review subscription services for cost optimization',
      'Implement automated invoicing to improve cash flow',
      'Consider early payment discounts for clients'
    ];
  }

  // Advanced Action Capabilities

  async executeBatchActions(actions: AIAction[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    for (const action of actions) {
      const result = await this.executeAction(action);
      results.push(result);
    }

    return results;
  }

  async validateAction(action: AIAction): Promise<boolean> {
    // Validate action before execution
    const requiredParams = {
      'create_invoice': ['client', 'amount'],
      'create_expense': ['vendor', 'amount'],
      'generate_report': ['type'],
      'scan_receipt': ['image'],
      'update_client': ['name'],
      'send_reminder': ['clientId']
    };

    const required = requiredParams[action.type];
    if (!required) return true;

    return required.every(param => action.parameters[param] !== undefined);
  }

  async getActionHistory(userId: string, limit: number = 50): Promise<any[]> {
    // In production, fetch from database
    return [];
  }
}

export const actionEngine = new ActionEngine();
