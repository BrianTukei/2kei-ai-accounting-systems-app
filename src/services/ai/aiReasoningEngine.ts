// AI Reasoning Engine - The Brain of 2K AI Accounting Systems
// Advanced AI SaaS Architecture for Intelligent Financial Management

export interface AIRequest {
  message: string;
  userId: string;
  context?: AIContext;
  memory?: AIMemory;
}

export interface AIContext {
  businessName?: string;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  currentBalance?: number;
  recentTransactions?: any[];
  unpaidInvoices?: any[];
  activeClients?: any[];
}

export interface AIMemory {
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
      // Step 1: Build enhanced context
      const enhancedPrompt = this.buildEnhancedPrompt(request);
      
      // Step 2: Send to Llama 3 with reasoning capabilities
      const reasoning = await this.callLlama3(enhancedPrompt);
      
      // Step 3: Parse response and extract actions
      const response = this.parseAIResponse(reasoning);
      
      return response;
    } catch (error) {
      console.error('AI Reasoning Engine error:', error);
      throw new Error('AI processing failed');
    }
  }

  private buildEnhancedPrompt(request: AIRequest): string {
    const { message, context, memory } = request;

    let prompt = `You are the advanced AI brain for 2K AI Accounting Systems, an intelligent financial management platform for African businesses.

Your capabilities include:
- Financial analysis and insights
- Automated bookkeeping
- Receipt processing and categorization
- Invoice and expense management
- Business financial advice
- Cash flow forecasting
- Fraud detection
- Profit optimization

BUSINESS CONTEXT:
${context ? this.formatContext(context) : 'No business context available'}

MEMORY & HISTORY:
${memory ? this.formatMemory(memory) : 'No memory available'}

USER REQUEST:
${message}

Please analyze this request and provide:
1. Reasoning about what the user wants
2. Any actions that should be taken
3. Financial insights based on context
4. Recommendations for the business
5. Follow-up questions if needed

Respond in this JSON format:
{
  "reasoning": "Your analysis of the user request",
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

  private formatContext(context: AIContext): string {
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

  private formatMemory(memory: AIMemory): string {
    if (!memory) return '';
    
    return `
Industry: ${memory.userPreferences?.industry || 'Not specified'}
Business Size: ${memory.userPreferences?.businessSize || 'Not specified'}
Currency: ${memory.userPreferences?.currency || 'USD'}
Tax Region: ${memory.userPreferences?.taxRegion || 'Not specified'}

Financial History:
- Average Monthly Revenue: $${memory.financialHistory?.avgMonthlyRevenue || 0}
- Average Monthly Expenses: $${memory.financialHistory?.avgMonthlyExpenses || 0}
- Profit Margin: ${memory.financialHistory?.profitMargin || 0}%
- Growth Rate: ${memory.financialHistory?.growthRate || 0}%

Recent Chats: ${memory.previousChats?.length || 0} conversations`;
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

  async analyzeFinancialHealth(context: AIContext): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Analyze the financial health of this business and provide actionable insights",
      userId: 'system',
      context
    };

    return this.processRequest(request);
  }

  async detectAnomalies(transactions: any[]): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Detect any unusual or suspicious transactions in this data",
      userId: 'system',
      context: { recentTransactions: transactions }
    };

    return this.processRequest(request);
  }

  async forecastCashflow(context: AIContext): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Forecast cash flow for the next 3 months based on current trends",
      userId: 'system',
      context
    };

    return this.processRequest(request);
  }

  async optimizeExpenses(context: AIContext): Promise<AIResponse> {
    const request: AIRequest = {
      message: "Identify opportunities to reduce expenses without impacting business operations",
      userId: 'system',
      context
    };

    return this.processRequest(request);
  }
}

export const aiReasoningEngine = new AIReasoningEngine();
