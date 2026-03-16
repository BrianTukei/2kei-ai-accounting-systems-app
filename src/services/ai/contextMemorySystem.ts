// Context + Memory System - Makes AI Very Smart
// Advanced AI SaaS Memory Management for 2K AI Accounting Systems

import { AIContext, AIMemory } from './aiReasoningEngine';

export interface UserFinancialProfile {
  userId: string;
  businessName: string;
  industry: string;
  businessSize: string;
  currency: string;
  taxRegion: string;
  establishedDate: string;
}

export interface FinancialMetrics {
  userId: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  currentBalance: number;
  profitMargin: number;
  growthRate: number;
  lastUpdated: string;
}

export interface ConversationMemory {
  userId: string;
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    intent?: string;
    entities?: Record<string, any>;
  }>;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export class ContextMemorySystem {
  private userProfiles: Map<string, UserFinancialProfile> = new Map();
  private financialMetrics: Map<string, FinancialMetrics> = new Map();
  private conversationHistory: Map<string, ConversationMemory[]> = new Map();
  private businessInsights: Map<string, any[]> = new Map();

  constructor() {
    this.initializeMemory();
  }

  private async initializeMemory() {
    console.log('🧠 Context + Memory System initialized');
    // Load existing data from database in production
  }

  // User Profile Management
  async updateUserProfile(userId: string, profile: Partial<UserFinancialProfile>): Promise<void> {
    const existing = this.userProfiles.get(userId) || {
      userId,
      businessName: '',
      industry: '',
      businessSize: '',
      currency: 'USD',
      taxRegion: '',
      establishedDate: ''
    };

    const updated = { ...existing, ...profile };
    this.userProfiles.set(userId, updated);
    console.log(`📝 Updated profile for user: ${userId}`);
  }

  async getUserProfile(userId: string): Promise<UserFinancialProfile | null> {
    return this.userProfiles.get(userId) || null;
  }

  // Financial Metrics Management
  async updateFinancialMetrics(userId: string, metrics: Partial<FinancialMetrics>): Promise<void> {
    const existing = this.financialMetrics.get(userId) || {
      userId,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      currentBalance: 0,
      profitMargin: 0,
      growthRate: 0,
      lastUpdated: new Date().toISOString()
    };

    const updated = { 
      ...existing, 
      ...metrics,
      lastUpdated: new Date().toISOString()
    };
    this.financialMetrics.set(userId, updated);
    console.log(`📊 Updated financial metrics for user: ${userId}`);
  }

  async getFinancialMetrics(userId: string): Promise<FinancialMetrics | null> {
    return this.financialMetrics.get(userId) || null;
  }

  // Conversation Memory Management
  async addConversationMessage(
    userId: string, 
    sessionId: string, 
    role: 'user' | 'assistant', 
    content: string,
    intent?: string,
    entities?: Record<string, any>
  ): Promise<void> {
    const userConversations = this.conversationHistory.get(userId) || [];
    
    let conversation = userConversations.find(c => c.sessionId === sessionId);
    
    if (!conversation) {
      conversation = {
        userId,
        sessionId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      userConversations.push(conversation);
      this.conversationHistory.set(userId, userConversations);
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      intent,
      entities
    });

    conversation.updatedAt = new Date().toISOString();

    // Keep only last 50 messages per conversation
    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-50);
    }

    console.log(`💬 Added message to conversation ${sessionId} for user: ${userId}`);
  }

  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationMemory[]> {
    const conversations = this.conversationHistory.get(userId) || [];
    return conversations
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  async getRecentMessages(userId: string, limit: number = 5): Promise<any[]> {
    const conversations = await this.getConversationHistory(userId, 5);
    const allMessages: any[] = [];
    
    conversations.forEach(conv => {
      allMessages.push(...conv.messages);
    });

    return allMessages
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Business Insights Management
  async addBusinessInsight(userId: string, insight: any): Promise<void> {
    const insights = this.businessInsights.get(userId) || [];
    insights.push({
      ...insight,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 insights
    if (insights.length > 100) {
      insights.splice(0, insights.length - 100);
    }
    
    this.businessInsights.set(userId, insights);
    console.log(`💡 Added business insight for user: ${userId}`);
  }

  async getBusinessInsights(userId: string): Promise<any[]> {
    return this.businessInsights.get(userId) || [];
  }

  // Context Building
  async buildAIContext(userId: string): Promise<AIContext> {
    const profile = await this.getUserProfile(userId);
    const metrics = await this.getFinancialMetrics(userId);
    const insights = await this.getBusinessInsights(userId);

    // In production, fetch real data from database
    const recentTransactions = await this.getRecentTransactions(userId);
    const unpaidInvoices = await this.getUnpaidInvoices(userId);
    const activeClients = await this.getActiveClients(userId);

    return {
      businessName: profile?.businessName || '',
      monthlyRevenue: metrics?.monthlyRevenue || 0,
      monthlyExpenses: metrics?.monthlyExpenses || 0,
      currentBalance: metrics?.currentBalance || 0,
      recentTransactions,
      unpaidInvoices,
      activeClients
    };
  }

  async buildAIMemory(userId: string): Promise<AIMemory> {
    const profile = await this.getUserProfile(userId);
    const metrics = await this.getFinancialMetrics(userId);
    const recentMessages = await this.getRecentMessages(userId, 10);

    return {
      previousChats: recentMessages,
      userPreferences: {
        industry: profile?.industry || '',
        businessSize: profile?.businessSize || '',
        currency: profile?.currency || 'USD',
        taxRegion: profile?.taxRegion || ''
      },
      financialHistory: {
        avgMonthlyRevenue: metrics?.monthlyRevenue || 0,
        avgMonthlyExpenses: metrics?.monthlyExpenses || 0,
        profitMargin: metrics?.profitMargin || 0,
        growthRate: metrics?.growthRate || 0
      }
    };
  }

  // Advanced Memory Features

  async extractIntent(message: string): Promise<string> {
    // Simple intent extraction - can be enhanced with AI
    const intents = {
      'create_invoice': ['create invoice', 'new invoice', 'bill', 'charge'],
      'create_expense': ['add expense', 'new expense', 'spent', 'paid'],
      'scan_receipt': ['scan receipt', 'upload receipt', 'receipt'],
      'generate_report': ['report', 'summary', 'analytics', 'insights'],
      'financial_analysis': ['analyze', 'profit', 'loss', 'performance'],
      'cash_flow': ['cash flow', 'forecast', 'prediction'],
      'tax': ['tax', 'vat', 'deduction'],
      'client': ['client', 'customer', 'invoice']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  async extractEntities(message: string): Promise<Record<string, any>> {
    const entities: Record<string, any> = {};

    // Extract amounts
    const amountMatch = message.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/g);
    if (amountMatch) {
      entities.amounts = amountMatch.map(a => parseFloat(a.replace(/[$,]/g, '')));
    }

    // Extract dates
    const dateMatch = message.match(/\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g);
    if (dateMatch) {
      entities.dates = dateMatch;
    }

    // Extract client names (simple pattern)
    const clientMatch = message.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g);
    if (clientMatch && clientMatch.length > 0) {
      entities.clients = clientMatch.slice(0, 3); // Limit to 3 potential clients
    }

    return entities;
  }

  async rememberInteraction(userId: string, sessionId: string, userMessage: string, aiResponse: string): Promise<void> {
    const intent = await this.extractIntent(userMessage);
    const entities = await this.extractEntities(userMessage);

    await this.addConversationMessage(userId, sessionId, 'user', userMessage, intent, entities);
    await this.addConversationMessage(userId, sessionId, 'assistant', aiResponse);
  }

  // Data fetching methods (mock for now, connect to real database)
  private async getRecentTransactions(userId: string): Promise<any[]> {
    // Mock data - replace with real database query
    return [
      { id: 1, description: 'Office Supplies', amount: 150, date: '2024-03-15', category: 'Office' },
      { id: 2, description: 'Client Payment', amount: 2000, date: '2024-03-14', category: 'Income' }
    ];
  }

  private async getUnpaidInvoices(userId: string): Promise<any[]> {
    // Mock data - replace with real database query
    return [
      { id: 1, client: 'John Doe', amount: 500, dueDate: '2024-03-20', daysOverdue: 0 },
      { id: 2, client: 'Jane Smith', amount: 750, dueDate: '2024-03-10', daysOverdue: 5 }
    ];
  }

  private async getActiveClients(userId: string): Promise<any[]> {
    // Mock data - replace with real database query
    return [
      { id: 1, name: 'John Doe', totalInvoiced: 5000, paid: 4500 },
      { id: 2, name: 'Jane Smith', totalInvoiced: 3000, paid: 3000 }
    ];
  }

  // Memory Analytics
  async getMemoryAnalytics(userId: string): Promise<any> {
    const conversations = await this.getConversationHistory(userId);
    const insights = await this.getBusinessInsights(userId);
    const metrics = await this.getFinancialMetrics(userId);

    return {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
      totalInsights: insights.length,
      financialHealth: {
        revenue: metrics?.monthlyRevenue || 0,
        expenses: metrics?.monthlyExpenses || 0,
        profitMargin: metrics?.profitMargin || 0
      },
      mostCommonIntents: this.getMostCommonIntents(conversations)
    };
  }

  private getMostCommonIntents(conversations: ConversationMemory[]): string[] {
    const intentCounts: Record<string, number> = {};
    
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.intent) {
          intentCounts[msg.intent] = (intentCounts[msg.intent] || 0) + 1;
        }
      });
    });

    return Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent]) => intent);
  }
}

export const contextMemorySystem = new ContextMemorySystem();
