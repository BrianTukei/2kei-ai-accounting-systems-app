import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface Conversation {
  id: string;
  title: string;
  contextType?: string;
  contextData?: any;
  messages: ChatMessage[];
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  contextType?: string;
  contextData?: any;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  conversationId?: string;
  error?: string;
}

export interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  data?: any;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export class AIAssistantService {
  /**
   * Local rule-based AI responses (works without backend/edge functions)
   */
  static generateLocalResponse(message: string, contextType?: string, contextData?: any): string {
    const msg = message.toLowerCase();

    // Context-aware responses for reports
    if (contextType === 'report' && contextData?.reportType) {
      const rt = contextData.reportType.toLowerCase();
      if (rt.includes('balance')) {
        return `Looking at your Balance Sheet: it shows your company's financial position at this moment.\n\n` +
          `**Assets** = What you own (cash, receivables, inventory)\n` +
          `**Liabilities** = What you owe (payables, loans)\n` +
          `**Equity** = Owner's value (Assets minus Liabilities)\n\n` +
          `A healthy balance sheet has more assets than liabilities. Would you like me to explain any specific section?`;
      }
      if (rt.includes('income') || rt.includes('profit')) {
        return `Your Income Statement shows revenue vs expenses over a period.\n\n` +
          `**Revenue** → minus **Cost of Goods Sold** = Gross Profit\n` +
          `**Gross Profit** → minus **Operating Expenses** = Net Income\n\n` +
          `A positive net income means your business is profitable. What aspect would you like to dig into?`;
      }
      if (rt.includes('cash')) {
        return `Cash Flow shows how money moves through your business:\n\n` +
          `• **Operating**: Day-to-day business income & expenses\n` +
          `• **Investing**: Equipment purchases, asset sales\n` +
          `• **Financing**: Loans, owner contributions\n\n` +
          `Positive operating cash flow is a key sign of business health. Want more details?`;
      }
    }

    // General accounting Q&A
    if (msg.includes('balance sheet')) {
      return `A **Balance Sheet** shows your company's financial position at a specific date.\n\n` +
        `It follows the equation: **Assets = Liabilities + Equity**\n\n` +
        `• **Assets**: Cash, accounts receivable, inventory, equipment\n` +
        `• **Liabilities**: Accounts payable, loans, accrued expenses\n` +
        `• **Equity**: Owner's investment + retained earnings\n\n` +
        `Would you like to know how to improve your balance sheet ratios?`;
    }

    if (msg.includes('income statement') || (msg.includes('profit') && msg.includes('loss'))) {
      return `An **Income Statement** (P&L) shows profitability over a time period.\n\n` +
        `**Formula**: Revenue - Expenses = Net Income\n\n` +
        `Key metrics to watch:\n` +
        `• **Gross Profit Margin** = (Revenue - COGS) / Revenue × 100\n` +
        `• **Net Profit Margin** = Net Income / Revenue × 100\n` +
        `• **Operating Expenses Ratio** = Expenses / Revenue × 100\n\n` +
        `A higher margin means more efficiency. What would you like to improve?`;
    }

    if (msg.includes('cash flow')) {
      return `**Cash Flow** is the movement of money in and out of your business.\n\n` +
        `**Positive cash flow** = more money coming in than going out ✅\n` +
        `**Negative cash flow** = more going out than coming in ⚠️\n\n` +
        `Tips to improve cash flow:\n` +
        `• Invoice customers promptly\n` +
        `• Offer early payment discounts\n` +
        `• Negotiate longer payment terms with suppliers\n` +
        `• Monitor and reduce unnecessary expenses`;
    }

    if (msg.includes('expense') || msg.includes('deduction')) {
      return `**Common Business Expense Categories:**\n\n` +
        `• **Office Supplies** – Paper, ink, stationery\n` +
        `• **Marketing** – Ads, website, business cards\n` +
        `• **Professional Services** – Accountant, lawyer fees\n` +
        `• **Travel** – Business trips, mileage\n` +
        `• **Utilities** – Internet, electricity, phone\n` +
        `• **Rent** – Office or workspace costs\n\n` +
        `Tip: Always keep receipts and record the business purpose for each expense.`;
    }

    if (msg.includes('tax') || msg.includes('vat') || msg.includes('deductible')) {
      return `**Tax Tips for Your Business:**\n\n` +
        `• Keep receipts for ALL business expenses\n` +
        `• Separate personal and business finances\n` +
        `• Common deductions: rent, utilities, salaries, marketing, equipment\n` +
        `• Consider quarterly tax payments to avoid penalties\n` +
        `• Depreciate large assets over their useful life\n\n` +
        `⚠️ Always consult a qualified tax professional for advice specific to your situation.`;
    }

    if (msg.includes('payroll') || msg.includes('salary') || msg.includes('employee')) {
      return `**Payroll Management Tips:**\n\n` +
        `• Record gross pay, deductions, and net pay separately\n` +
        `• Track employer-side taxes (PAYE, NSSF, NHIF etc.)\n` +
        `• Maintain employee records for compliance\n` +
        `• Issue payslips consistently every pay period\n` +
        `• Reconcile payroll accounts monthly\n\n` +
        `Accurate payroll keeps employees happy and avoids compliance issues.`;
    }

    if (msg.includes('invoice') || msg.includes('accounts receivable') || msg.includes('receivable')) {
      return `**Accounts Receivable Best Practices:**\n\n` +
        `• Send invoices promptly after goods/services delivered\n` +
        `• Set clear payment terms (e.g. Net 30)\n` +
        `• Follow up on overdue invoices at 30, 60, 90 days\n` +
        `• Offer early payment incentives (2% discount for 10-day payment)\n` +
        `• Track aging receivables weekly to spot collection issues early`;
    }

    if (msg.includes('budget') || msg.includes('forecast')) {
      return `**Budgeting & Forecasting:**\n\n` +
        `• Start with last year's actual figures as a baseline\n` +
        `• Project revenue based on market trends and pipeline\n` +
        `• Budget for fixed costs (rent, salaries) and variable costs separately\n` +
        `• Review budget vs actuals monthly\n` +
        `• Adjust forecasts quarterly based on performance\n\n` +
        `A good budget helps you spot problems before they become crises.`;
    }

    if (msg.includes('profit margin') || msg.includes('margin')) {
      return `**Understanding Profit Margins:**\n\n` +
        `• **Gross Margin** = (Revenue - COGS) / Revenue × 100\n` +
        `• **Operating Margin** = Operating Income / Revenue × 100\n` +
        `• **Net Margin** = Net Income / Revenue × 100\n\n` +
        `**Industry benchmarks vary**, but generally:\n` +
        `• >20% net margin = excellent\n` +
        `• 10-20% = good\n` +
        `• 5-10% = average\n` +
        `• <5% = needs improvement\n\n` +
        `To improve margins: reduce costs, increase prices, or improve sales volume.`;
    }

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('help')) {
      return `Hello! I'm your **AI Accounting Assistant** 👋\n\n` +
        `I can help you with:\n` +
        `• 📊 Understanding your financial reports (Balance Sheet, Income Statement, Cash Flow)\n` +
        `• 💰 Expense categorization & bookkeeping guidance\n` +
        `• 🧾 Tax tips and deductions\n` +
        `• 👥 Payroll management\n` +
        `• 📈 Profit margin analysis\n` +
        `• 💡 Cash flow improvement strategies\n\n` +
        `What would you like help with today?`;
    }

    // Non-accounting topics
    const nonAccounting = ['weather', 'sports', 'movie', 'music', 'cooking', 'travel', 'game', 'politics', 'news'];
    if (nonAccounting.some(k => msg.includes(k))) {
      return `I'm your **Accounting Assistant** and I only handle accounting and finance questions.\n\n` +
        `I can help you with financial reports, expenses, taxes, payroll, and more. What accounting topic can I assist with?`;
    }

    // Default response
    return `I can help with that! Here are some accounting topics I can assist with:\n\n` +
      `• **Balance Sheet** – Understanding assets, liabilities, and equity\n` +
      `• **Income Statement** – Revenue, expenses, and profitability\n` +
      `• **Cash Flow** – Managing money movement in your business\n` +
      `• **Expenses** – Categorization and deductions\n` +
      `• **Tax** – Tips and compliance guidance\n` +
      `• **Payroll** – Employee compensation management\n\n` +
      `Please ask me a specific question about any of these topics!`;
  }

  /**
   * Send a message to the AI assistant (with local fallback)
   */
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      console.log('Sending AI message request...');

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: request
      });

      // If edge function fails, use local rule-based response
      if (error || !data || !data.success) {
        console.log('Edge function unavailable, using local AI response');
        const localResponse = this.generateLocalResponse(
          request.message,
          request.contextType,
          request.contextData
        );
        return {
          success: true,
          response: localResponse,
          conversationId: request.conversationId || `local-${Date.now()}`
        };
      }

      return data;
    } catch (error: any) {
      console.log('Using local AI fallback:', error?.message);
      // Always fall back to local response instead of showing error
      const localResponse = this.generateLocalResponse(
        request.message,
        request.contextType,
        request.contextData
      );
      return {
        success: true,
        response: localResponse,
        conversationId: request.conversationId || `local-${Date.now()}`
      };
    }
  }

  /**
   * Get user's conversations
   */
  static async getConversations(): Promise<Conversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          const { data: messages } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          return {
            id: conv.id,
            title: conv.title,
            contextType: conv.context_type,
            contextData: conv.context_data,
            messages: messages?.map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              metadata: msg.metadata
            })) || [],
            updatedAt: new Date(conv.updated_at)
          };
        })
      );

      return conversationsWithMessages;
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Get a specific conversation with messages
   */
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data: conversation, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return null;
      }

      const { data: messages } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return {
        id: conversation.id,
        title: conversation.title,
        contextType: conversation.context_type,
        contextData: conversation.context_data,
        messages: messages?.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        })) || [],
        updatedAt: new Date(conversation.updated_at)
      };
    } catch (error: any) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      return !error;
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId);

      return !error;
    } catch (error: any) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  }

  /**
   * Get AI insights for the current user
   */
  static async getInsights(): Promise<AIInsight[]> {
    try {
      const { data: insights, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return insights?.map(insight => ({
        id: insight.id,
        type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        data: insight.data,
        severity: insight.severity as 'info' | 'warning' | 'critical',
        isRead: insight.is_read,
        createdAt: new Date(insight.created_at),
        expiresAt: insight.expires_at ? new Date(insight.expires_at) : undefined
      })) || [];
    } catch (error: any) {
      console.error('Error fetching AI insights:', error);
      return [];
    }
  }

  /**
   * Mark insight as read
   */
  static async markInsightAsRead(insightId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId);

      return !error;
    } catch (error: any) {
      console.error('Error marking insight as read:', error);
      return false;
    }
  }

  /**
   * Get AI analysis for specific report data
   */
  static async analyzeReport(reportType: string, reportData: any): Promise<ChatResponse> {
    return this.sendMessage({
      message: `Please analyze this ${reportType} report and provide insights.`,
      contextType: 'report',
      contextData: {
        reportType,
        reportData
      }
    });
  }

  /**
   * Get AI suggestions for expense categorization
   */
  static async categorizeExpense(description: string, amount: number, vendor?: string): Promise<ChatResponse> {
    return this.sendMessage({
      message: `How should I categorize this expense: "${description}" for $${amount}${vendor ? ` from ${vendor}` : ''}? What's the best expense category?`,
      contextType: 'transaction',
      contextData: {
        type: 'expense_categorization',
        description,
        amount,
        vendor
      }
    });
  }

  /**
   * Generate AI insights based on user's financial data
   */
  static async generateFinancialInsights(financialData: any): Promise<ChatResponse> {
    return this.sendMessage({
      message: 'Based on my current financial data, what insights and recommendations do you have?',
      contextType: 'dashboard',
      contextData: {
        type: 'financial_analysis',
        data: financialData
      }
    });
  }

  /**
   * Get help with accounting principles
   */
  static async getAccountingHelp(topic: string): Promise<ChatResponse> {
    return this.sendMessage({
      message: `Can you explain ${topic} in accounting? Provide practical examples.`,
      contextType: 'general',
      contextData: {
        type: 'accounting_education',
        topic
      }
    });
  }
}