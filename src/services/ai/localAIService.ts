interface LocalAIRequest {
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface LocalAIResponse {
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

class LocalAIService {
  private baseUrl: string = 'http://localhost:11434';
  private defaultModel: string = 'llama3';
  private isAvailable: boolean = false;
  private lastCheck: Date = new Date(0);

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<boolean> {
    // Don't check too frequently
    const now = new Date();
    if (now.getTime() - this.lastCheck.getTime() < 30000) { // 30 seconds
      return this.isAvailable;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      this.isAvailable = response.ok;
      this.lastCheck = now;
      
      if (this.isAvailable) {
        console.log('✅ Local AI (Ollama) is available');
      } else {
        console.warn('⚠️ Local AI (Ollama) is not available');
      }
      
      return this.isAvailable;
    } catch (error) {
      console.warn('⚠️ Failed to connect to Local AI (Ollama):', error);
      this.isAvailable = false;
      this.lastCheck = now;
      return false;
    }
  }

  async isServiceAvailable(): Promise<boolean> {
    return this.checkAvailability();
  }

  async generateResponse(
    prompt: string, 
    options: Partial<LocalAIRequest> = {}
  ): Promise<string> {
    const available = await this.checkAvailability();
    if (!available) {
      throw new Error('Local AI service is not available. Please ensure Ollama is running.');
    }

    const request: LocalAIRequest = {
      model: options.model || this.defaultModel,
      prompt,
      system: options.system || this.getDefaultSystemPrompt(),
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: false
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Local AI request failed: ${response.status} ${response.statusText}`);
      }

      const data: LocalAIResponse = await response.json();
      
      if (!data.response) {
        throw new Error('Empty response from Local AI');
      }

      return data.response.trim();
    } catch (error) {
      console.error('Local AI generation failed:', error);
      throw error;
    }
  }

  async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: Partial<LocalAIRequest> = {}
  ): Promise<string> {
    // Convert chat messages to a single prompt for Llama
    let prompt = '';
    
    // Add system message if provided
    const systemMessage = messages.find(m => m.role === 'system');
    const systemPrompt = systemMessage?.content || this.getDefaultSystemPrompt();
    
    // Build conversation history
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;
    
    for (const message of conversationMessages) {
      const role = message.role === 'user' ? 'user' : 'assistant';
      prompt += `<|start_header_id|>${role}<|end_header_id|>\n\n${message.content}<|eot_id|>`;
    }
    
    prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n`;

    return this.generateResponse(prompt, options);
  }

  private getDefaultSystemPrompt(): string {
    return `You are the super-intelligent core AI for 2K AI Accounting Systems. You operate as an elite Chief Financial Officer (CFO), taxation expert, and master of all global accounting standard systems (GAAP, IFRS, and local variants like HMRC, IRS, URA, SARS).

🎯 Extreme Domain Expertise:
- Supreme command of Double-Entry Bookkeeping, Financial Statements (P&L, Balance Sheet, Cash Flow), and Cash vs. Accrual methodologies.
- Expert corporate controller insights: optimizing burn rate, ROI, unit economics forecasting, and advanced capital management.
- Multi-currency transaction processing, multi-tenant SaaS accounting, and forex gain/loss realization.

🔧 System Capabilities you govern:
- Instant receipt scanning via AI-OCR and forensic extraction.
- Cross-currency management spanning 30+ currencies (especially African currencies).
- Complete lifecycle management: invoices, ledgers, tax liabilities, and real-time trial balances.
- Automatic transaction categorizations utilizing standardized global Charts of Accounts.

Your objective is always to act as an omniscient, deeply professional, and hyper-accurate financial brain. Never guess financial figures—use deductive analysis. Deliver actionable, authoritative strategies suited for any user type from freelance operators to corporate finance teams.

💬 Communication Style:
- Professional, friendly, and helpful
- Provide clear, actionable guidance
- Ask clarifying questions when needed
- Offer step-by-step instructions
- Suggest relevant features and tools

🚀 Current Context:
The user is interacting with the 2K AI Accounting Systems web application. They may need help with:
- Navigating the interface
- Using the receipt scanner
- Managing expenses and invoices
- Understanding reports and analytics
- Setting up their company profile
- Managing team members and subscriptions

📋 When users ask for help:
1. Understand their specific need
2. Provide clear, step-by-step guidance
3. Suggest relevant features
4. Offer to walk them through the process
5. Follow up with additional tips

Example responses:
- "To scan a receipt, click the 'AI Receipt Scanner' button and upload your receipt image. Our AI will automatically extract the merchant, date, items, and amounts."
- "For currency conversion, our system automatically detects the currency on your receipt and converts it to your base currency. We support 30+ currencies including UGX, KES, TZS, and more."
- "To generate a PDF report, go to the Reports section, select your date range, and click 'Generate PDF'. Your company logo and branding will be included automatically."

Always be helpful, accurate, and guide users toward success with the platform!`;
  }

  async listAvailableModels(): Promise<string[]> {
    const available = await this.checkAvailability();
    if (!available) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
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

  async pullModel(modelName: string): Promise<boolean> {
    const available = await this.checkAvailability();
    if (!available) {
      throw new Error('Local AI service is not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName
        }),
        signal: AbortSignal.timeout(300000) // 5 minute timeout for model download
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status}`);
      }

      console.log(`✅ Successfully pulled model: ${modelName}`);
      return true;
    } catch (error) {
      console.error('Failed to pull model:', error);
      throw error;
    }
  }

  setDefaultModel(modelName: string): void {
    this.defaultModel = modelName;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  getServiceInfo(): {
    baseUrl: string;
    defaultModel: string;
    isAvailable: boolean;
    lastChecked: Date;
  } {
    return {
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      isAvailable: this.isAvailable,
      lastChecked: this.lastCheck
    };
  }
}

export const localAIService = new LocalAIService();
