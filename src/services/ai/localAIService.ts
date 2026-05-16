interface LocalAIRequest {
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

class LocalAIService {
  private defaultModel: string = 'gemini-1.5-pro';
  private isAvailable: boolean = false;
  private lastCheck: Date = new Date(0);

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<boolean> {
    const now = new Date();
    if (now.getTime() - this.lastCheck.getTime() < 30000) {
      return this.isAvailable;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/status', {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: AbortSignal.timeout(5000)
      });
      
      this.isAvailable = response.ok;
      this.lastCheck = now;
      
      return this.isAvailable;
    } catch (error) {
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
      throw new Error('AI service is not available.');
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt,
          system: options.system || this.getDefaultSystemPrompt(),
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.response) {
        throw new Error('Empty response from AI');
      }

      return data.data.response.trim();
    } catch (error) {
      console.error('AI generation failed:', error);
      throw error;
    }
  }

  async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: Partial<LocalAIRequest> = {}
  ): Promise<string> {
    let prompt = '';
    const systemMessage = messages.find(m => m.role === 'system');
    const systemPrompt = systemMessage?.content || this.getDefaultSystemPrompt();
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    for (const message of conversationMessages) {
      const role = message.role 
=== 'user' ? 'User' : 'Assistant';
      prompt += `${role}: ${message.content}\n\n`;
    }

    return this.generateResponse(prompt, { ...options, system: systemPrompt });
  }

  private getDefaultSystemPrompt(): string {
    return 'You are the AI assistant for 2K AI Accounting Systems, a comprehensive accounting and expense management platform.\n\nAlways be helpful, accurate, and guide users toward success with the platform!';
  }

  async listAvailableModels(): Promise<string[]> {
    return ['gemini-1.5-pro'];
  }

  async pullModel(modelName: string): Promise<boolean> {
    return true;
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
      baseUrl: '/api/ai',
      defaultModel: this.defaultModel,
      isAvailable: this.isAvailable,
      lastChecked: this.lastCheck
    };
  }
}

export const localAIService = new LocalAIService();