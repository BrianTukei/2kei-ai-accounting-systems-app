// Advanced AI Chat Interface - Frontend Integration
// Advanced AI SaaS Chat System for 2K AI Accounting Systems

import { aiReasoningEngine, AIRequest, AIResponse, AIAction } from './aiReasoningEngine';
import { contextMemorySystem } from './contextMemorySystem';
import { actionEngine, ActionResult } from './actionEngine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  entities?: Record<string, any>;
  action?: AIAction;
  actionResult?: ActionResult;
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context?: any;
  startedAt: string;
  lastActivity: string;
}

export interface ChatOptions {
  enableActions?: boolean;
  enableMemory?: boolean;
  enableContext?: boolean;
  maxMessages?: number;
  typingDelay?: number;
}

export class AdvancedAIChatInterface {
  private sessions: Map<string, ChatSession> = new Map();
  private options: ChatOptions = {
    enableActions: true,
    enableMemory: true,
    enableContext: true,
    maxMessages: 100,
    typingDelay: 1000
  };

  constructor(options?: Partial<ChatOptions>) {
    this.options = { ...this.options, ...options };
    this.initializeChatInterface();
  }

  private initializeChatInterface() {
    console.log('💬 Advanced AI Chat Interface initialized');
    console.log('🚀 Features: Actions, Memory, Context, RAG');
  }

  // Session Management
  async createSession(userId: string): Promise<ChatSession> {
    const sessionId = this.generateSessionId();
    const session: ChatSession = {
      id: sessionId,
      userId,
      messages: [],
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    console.log(`📱 Created chat session ${sessionId} for user ${userId}`);
    
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create user message
    const userChatMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    session.messages.push(userChatMessage);
    session.lastActivity = new Date().toISOString();

    // Process message with AI
    const aiMessage = await this.processMessage(session, userMessage);
    
    session.messages.push(aiMessage);
    session.lastActivity = new Date().toISOString();

    // Limit messages
    if (session.messages.length > this.options.maxMessages) {
      session.messages = session.messages.slice(-this.options.maxMessages);
    }

    // Store in memory system
    if (this.options.enableMemory) {
      await contextMemorySystem.rememberInteraction(
        session.userId,
        sessionId,
        userMessage,
        aiMessage.content
      );
    }

    return aiMessage;
  }

  private async processMessage(session: ChatSession, userMessage: string): Promise<ChatMessage> {
    try {
      // Build AI request with context and memory
      const aiRequest = await this.buildAIRequest(session, userMessage);
      
      // Get AI response
      const aiResponse = await aiReasoningEngine.processRequest(aiRequest);
      
      // Execute actions if any
      let actionResult: ActionResult | undefined;
      if (this.options.enableActions && aiResponse.action) {
        actionResult = await actionEngine.executeAction(aiResponse.action);
      }

      // Create AI message
      const aiMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: aiResponse.reasoning,
        timestamp: new Date().toISOString(),
        action: aiResponse.action,
        actionResult
      };

      return aiMessage;
    } catch (error) {
      console.error('Message processing failed:', error);
      
      return {
        id: this.generateMessageId(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async buildAIRequest(session: ChatSession, userMessage: string): Promise<AIRequest> {
    const context = this.options.enableContext 
      ? await contextMemorySystem.buildAIContext(session.userId)
      : undefined;

    const memory = this.options.enableMemory
      ? await contextMemorySystem.buildAIMemory(session.userId)
      : undefined;

    return {
      message: userMessage,
      userId: session.userId,
      context,
      memory
    };
  }

  // Advanced Chat Features

  async sendTypingIndicator(sessionId: string, isTyping: boolean): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const typingMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: isTyping
    };

    if (isTyping) {
      session.messages.push(typingMessage);
    } else {
      // Remove typing indicator
      session.messages = session.messages.filter(msg => !msg.isTyping);
    }
  }

  async searchMessages(sessionId: string, query: string): Promise<ChatMessage[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.messages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getContextualSuggestions(sessionId: string): Promise<string[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    // Generate contextual suggestions based on conversation
    const suggestions = [
      'Create an invoice for a new client',
      'Scan a receipt for expense tracking',
      'Generate a profit and loss report',
      'Check unpaid invoices',
      'Analyze monthly expenses',
      'Forecast cash flow for next quarter',
      'Update client information',
      'Send payment reminders'
    ];

    // Filter suggestions based on conversation context
    const recentMessages = session.messages.slice(-5);
    const context = recentMessages.map(msg => msg.content).join(' ').toLowerCase();

    return suggestions.filter(suggestion => {
      // Simple context filtering - can be enhanced with AI
      if (context.includes('invoice') && suggestion.includes('invoice')) return true;
      if (context.includes('receipt') && suggestion.includes('receipt')) return true;
      if (context.includes('report') && suggestion.includes('report')) return true;
      if (context.includes('client') && suggestion.includes('client')) return true;
      return Math.random() > 0.7; // Random selection for variety
    }).slice(0, 5);
  }

  async exportConversation(sessionId: string, format: 'json' | 'txt' = 'json'): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    switch (format) {
      case 'json':
        return {
          session: {
            id: session.id,
            userId: session.userId,
            startedAt: session.startedAt,
            lastActivity: session.lastActivity
          },
          messages: session.messages
        };
      
      case 'txt':
        return session.messages.map(msg => 
          `[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`
        ).join('\n\n');
      
      default:
        throw new Error('Unsupported export format');
    }
  }

  async clearSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.messages = [];
    session.lastActivity = new Date().toISOString();
    
    console.log(`🗑️ Cleared messages for session ${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    console.log(`🗑️ Deleted session ${sessionId}`);
  }

  // RAG (Retrieval Augmented Generation) Integration
  async searchBusinessData(userId: string, query: string): Promise<any[]> {
    // In production, search actual business database
    const mockResults = [
      {
        type: 'invoice',
        id: 'inv_001',
        client: 'John Doe',
        amount: 500,
        status: 'unpaid',
        dueDate: '2024-03-20'
      },
      {
        type: 'expense',
        id: 'exp_001',
        vendor: 'Office Supplies Co',
        amount: 150,
        category: 'Office Supplies',
        date: '2024-03-15'
      }
    ];

    // Simple search - in production use vector search or database queries
    return mockResults.filter(result => 
      JSON.stringify(result).toLowerCase().includes(query.toLowerCase())
    );
  }

  async enrichWithRAG(sessionId: string, userMessage: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) return userMessage;

    // Search for relevant business data
    const searchResults = await this.searchBusinessData(session.userId, userMessage);
    
    if (searchResults.length === 0) return userMessage;

    // Enrich the message with search results
    const ragContext = `
Relevant Business Data:
${searchResults.map(result => `- ${result.type}: ${JSON.stringify(result)}`).join('\n')}

User Question: ${userMessage}
`;

    return ragContext;
  }

  // Analytics and Insights
  async getSessionAnalytics(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const messages = session.messages;
    const userMessages = messages.filter(msg => msg.role === 'user');
    const aiMessages = messages.filter(msg => msg.role === 'assistant');
    const actionsExecuted = aiMessages.filter(msg => msg.action).length;
    const successfulActions = aiMessages.filter(msg => msg.actionResult?.success).length;

    return {
      sessionId: session.id,
      totalMessages: messages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      actionsExecuted,
      successfulActions,
      actionSuccessRate: actionsExecuted > 0 ? (successfulActions / actionsExecuted) * 100 : 0,
      sessionDuration: new Date(session.lastActivity).getTime() - new Date(session.startedAt).getTime(),
      averageResponseTime: this.calculateAverageResponseTime(messages),
      topIntents: this.getTopIntents(messages)
    };
  }

  private calculateAverageResponseTime(messages: ChatMessage[]): number {
    let totalTime = 0;
    let count = 0;

    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];
      
      if (current.role === 'user' && next.role === 'assistant') {
        const responseTime = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
        totalTime += responseTime;
        count++;
      }
    }

    return count > 0 ? totalTime / count : 0;
  }

  private getTopIntents(messages: ChatMessage[]): string[] {
    const intents: Record<string, number> = {};
    
    messages.forEach(msg => {
      if (msg.intent) {
        intents[msg.intent] = (intents[msg.intent] || 0) + 1;
      }
    });

    return Object.entries(intents)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent]) => intent);
  }

  // Helper Methods
  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateMessageId(): string {
    return 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Real-time Features
  async startRealTimeSession(userId: string): Promise<ChatSession> {
    const session = await this.createSession(userId);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: `👋 Welcome to 2K AI Accounting Systems! I'm your intelligent financial assistant. I can help you with:

📄 Creating invoices and managing expenses
🧾 Scanning and processing receipts
📊 Generating financial reports and insights
💰 Analyzing cash flow and profitability
🎯 Providing business financial advice

How can I assist you today?`,
      timestamp: new Date().toISOString()
    };

    session.messages.push(welcomeMessage);
    
    return session;
  }

  async handleVoiceMessage(sessionId: string, audioBlob: Blob): Promise<ChatMessage> {
    // In production, integrate with speech-to-text service
    const transcribedText = await this.transcribeAudio(audioBlob);
    return await this.sendMessage(sessionId, transcribedText);
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    // Mock transcription - in production use speech-to-text API
    return "Create an invoice for John Doe for $500";
  }

  async generateQuickActions(userId: string): Promise<any[]> {
    return [
      {
        id: 'quick_invoice',
        title: 'Create Invoice',
        description: 'Generate a new invoice for a client',
        icon: '📄',
        action: 'create_invoice'
      },
      {
        id: 'quick_expense',
        title: 'Add Expense',
        description: 'Record a new business expense',
        icon: '💸',
        action: 'create_expense'
      },
      {
        id: 'quick_scan',
        title: 'Scan Receipt',
        description: 'Upload and process a receipt',
        icon: '🧾',
        action: 'scan_receipt'
      },
      {
        id: 'quick_report',
        title: 'Generate Report',
        description: 'Create financial reports',
        icon: '📊',
        action: 'generate_report'
      }
    ];
  }
}

export const advancedAIChatInterface = new AdvancedAIChatInterface();
