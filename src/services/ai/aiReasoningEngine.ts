// AI Reasoning Engine - The Brain of 2K AI Accounting Systems
// Advanced AI SaaS Architecture for Intelligent Financial Management

import type { AIContext as BaseAIContext } from './types';
import { AIAssistantService } from '@/services/aiAssistant';

export interface AIRequest {
  message: string;
  userId: string;
  context?: ExtendedAIContext;
  memory?: AIMemory;
}

export interface AIMemory {
  id: string;
  userId: string;
  type: 'preference' | 'pattern' | 'insight' | 'action';
  key: string;
  value: any;
  frequency: number;
  lastUsed: Date;
  createdAt: Date;
  expiresAt?: Date;
  
  previousChats?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  userPreferences?: {
    industry?: string;
    businessSize?: string;
    currency?: string;
    taxRegion?: string;
  };
  financialHistory?: {
    avgMonthlyRevenue?: number;
    avgMonthlyExpenses?: number;
    profitMargin?: number;
    growthRate?: number;
  };
}

export interface ExtendedAIContext extends BaseAIContext {
  businessName?: string;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  currentBalance?: number;
  recentTransactions?: any[];
  unpaidInvoices?: any[];
  activeClients?: any[];
}

export interface AIResponse {
  reasoning: string;
  action?: AIAction;
  insights?: string[];
  recommendations?: string[];
  followUpQuestions?: string[];
}

export interface AIAction {
  type: 'create_invoice' | 'create_expense' | 'generate_report' | 'scan_receipt' | 'update_client' | 'send_reminder' | 'analyze_financials';
  parameters: Record<string, any>;
  confidence: number;
}

export class AIReasoningEngine {
  private ollamaUrl: string = 'http://localhost:11434';
  private model: string = 'llama3';

  constructor() {
    this.initializeSystem();
  }

  private async initializeSystem() {
    // Initialize AI brain with advanced capabilities
    console.log('🧠 AI Reasoning Engine initialized for 2K AI Accounting Systems');
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);
      const reasoning = await this.callLlama3(prompt);
      return this.parseAIResponse(reasoning);
    } catch (error) {
      console.error('AI processing failed, using local fallback:', error);

      // Fall back to the local 2KEI Financial Intelligence Engine so the AI
      // always returns a rich, data-driven response even when Ollama is offline.
      const localResponse = AIAssistantService.generateLocalResponse(
        request.message,
        /* contextType */ undefined,
        /* contextData */ request.context as any,
        /* financialSnapshot */ request.context?.financialSnapshot as any,
        /* userName */ undefined,
      );

      return {
        reasoning: localResponse,
        insights: [],
        recommendations: [],
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    const contextStr = this.formatContext(request.context);
    const memoryStr = this.formatMemory(request.memory);
    
    return `You are an advanced AI financial assistant for 2K AI Accounting Systems. You are helping with financial management and accounting tasks.

CONTEXT:
${contextStr}

MEMORY:
${memoryStr}

USER REQUEST:
${request.message}

Please provide a detailed response with:
1. Clear reasoning
2. Actionable insights
3. Specific recommendations
4. Follow-up questions if needed

Format your response as JSON:
{
  "reasoning": "detailed explanation",
  "action": {
    "type": "action_type",
    "parameters": {},
    "confidence": 0.9
  },
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "followUpQuestions": ["question 1", "question 2"]
}`;

    return prompt;
  }

  private formatContext(context: ExtendedAIContext): string {
    if (!context) return '';
    
    return `
Business Name: ${context.businessName || 'Not specified'}
Monthly Revenue: $${context.monthlyRevenue || 0}
Monthly Expenses: $${context.monthlyExpenses || 0}
Current Balance: $${context.currentBalance || 0}
Recent Transactions: ${context.recentTransactions?.length || 0} transactions
Unpaid Invoices: ${context.unpaidInvoices?.length || 0} invoices
Active Clients: ${context.activeClients?.length || 0} clients`;
  }

  private formatMemory(memory?: AIMemory): string {
    if (!memory) return 'No previous memory available.';
    
    return `
Previous Chats: ${memory.previousChats?.length || 0} conversations
User Preferences: ${JSON.stringify(memory.userPreferences || {})}
Financial History: ${JSON.stringify(memory.financialHistory || {})}`;
  }

  private async callLlama3(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          temperature: 0.3,
          max_tokens: 2000,
          stream: false
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Llama 3 request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Llama 3 call failed:', error);
      throw error;
    }
  }

  private parseAIResponse(reasoning: string): AIResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = reasoning.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reasoning: parsed.reasoning || reasoning,
          action: parsed.action,
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || [],
          followUpQuestions: parsed.followUpQuestions || []
        };
      }

      // Fallback to text parsing
      return {
        reasoning: reasoning,
        insights: this.extractInsights(reasoning),
        recommendations: this.extractRecommendations(reasoning)
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        reasoning: reasoning,
        insights: [],
        recommendations: []
      };
    }
  }

  private extractInsights(text: string): string[] {
    const insights: string[] = [];
    
    // Look for insight patterns
    const insightPatterns = [
      /insight[:\s]*(.+?)(?:\n|$)/gi,
      /analysis[:\s]*(.+?)(?:\n|$)/gi,
      /observation[:\s]*(.+?)(?:\n|$)/gi
    ];

    insightPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        insights.push(...matches.map(m => m.replace(/insight[:\s]*/gi, '').trim()));
      }
    });

    return insights.slice(0, 5); // Limit to 5 insights
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    
    // Look for recommendation patterns
    const recommendationPatterns = [
      /recommend[:\s]*(.+?)(?:\n|$)/gi,
      /suggest[:\s]*(.+?)(?:\n|$)/gi,
      /advice[:\s]*(.+?)(?:\n|$)/gi
    ];

    recommendationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        recommendations.push(...matches.map(m => m.replace(/recommend[:\s]*/gi, '').trim()));
      }
    });

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  // Advanced AI Capabilities

  async analyzeFinancialHealth(context: ExtendedAIContext): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Analyze the financial health of this business and provide actionable insights",
      userId: 'system',
      context: {
        ...context,
        message: "Analyze financial health",
        role: 'owner',
        currentPage: '/dashboard'
      }
    };

    return this.processRequest(request);
  }

  async detectAnomalies(transactions: any[]): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Detect any unusual or suspicious transactions in this data",
      userId: 'system',
      context: { 
        message: "Detect anomalies",
        role: 'owner',
        currentPage: '/dashboard',
        recentTransactions: transactions 
      }
    };

    return this.processRequest(request);
  }

  async forecastCashflow(context: ExtendedAIContext): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Forecast cash flow for the next 3 months based on current trends",
      userId: 'system',
      context: {
        ...context,
        message: "Forecast cash flow",
        role: 'owner',
        currentPage: '/dashboard'
      }
    };

    return this.processRequest(request);
  }

  async optimizeExpenses(context: ExtendedAIContext): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Identify opportunities to reduce expenses without impacting business operations",
      userId: 'system',
      context: {
        ...context,
        message: "Optimize expenses",
        role: 'owner',
        currentPage: '/dashboard'
      }
    };

    return this.processRequest(request);
  }
}

export const aiReasoningEngine = new AIReasoningEngine();
export default aiReasoningEngine;
