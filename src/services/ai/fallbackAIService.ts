// Fallback AI Service that switches between real Ollama and Mock service
import { backendAIService } from './backendAIService';
import { mockAIService } from './mockAIService';

export interface UnifiedAIResponse {
  response: string;
  model: string;
  timestamp: string;
  processingTime: number;
  isRealAI: boolean;
}

export interface UnifiedExtractedReceiptData {
  vendor: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  currency: string;
  category: string;
  confidence: number;
}

class FallbackAIService {
  private useRealAI = false;
  private lastCheckTime = 0;
  private checkInterval = 30000; // Check every 30 seconds

  async checkRealAIAvailability(): Promise<boolean> {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.lastCheckTime < this.checkInterval) {
      return this.useRealAI;
    }

    try {
      const isAvailable = await backendAIService.isServiceAvailable();
      this.useRealAI = isAvailable;
      this.lastCheckTime = now;
      
      if (isAvailable) {
        console.log('✅ Real AI (Ollama) is available');
      } else {
        console.log('🔄 Using Mock AI service - Ollama not available');
      }
      
      return isAvailable;
    } catch (error) {
      console.log('❌ Real AI check failed, using Mock service:', error.message);
      this.useRealAI = false;
      this.lastCheckTime = now;
      return false;
    }
  }

  async generateResponse(prompt: string, options?: any): Promise<UnifiedAIResponse> {
    const useReal = await this.checkRealAIAvailability();
    
    if (useReal) {
      try {
        const realResponse = await backendAIService.generateResponse({
          prompt,
          temperature: options?.temperature || 0.3,
          max_tokens: options?.max_tokens || 1000
        });
        return {
          response: realResponse.response,
          model: realResponse.model || 'llama3',
          timestamp: new Date().toISOString(),
          processingTime: realResponse.total_duration ? realResponse.total_duration / 1000000 : 1000,
          isRealAI: true
        };
      } catch (error) {
        console.log('Real AI failed, falling back to Mock:', error.message);
        // Fall back to mock service
        const mockResponse = await mockAIService.generateResponse(prompt, options);
        return {
          ...mockResponse,
          isRealAI: false
        };
      }
    } else {
      const mockResponse = await mockAIService.generateResponse(prompt, options);
      return {
        ...mockResponse,
        isRealAI: false
      };
    }
  }

  async extractReceiptData(ocrText: string): Promise<UnifiedExtractedReceiptData> {
    const useReal = await this.checkRealAIAvailability();
    
    if (useReal) {
      try {
        const realData = await backendAIService.extractReceiptData({
          text: ocrText,
          userId: 'system'
        });
        return {
          ...realData,
          isRealAI: true
        } as any;
      } catch (error) {
        console.log('Real AI receipt extraction failed, using Mock:', error.message);
        const mockData = await mockAIService.extractReceiptData(ocrText);
        return {
          ...mockData,
          isRealAI: false
        } as any;
      }
    } else {
      const mockData = await mockAIService.extractReceiptData(ocrText);
      return {
        ...mockData,
        isRealAI: false
      } as any;
    }
  }

  async handleChatbotRequest(message: string, context?: any): Promise<string> {
    const useReal = await this.checkRealAIAvailability();
    
    if (useReal) {
      try {
        return await backendAIService.handleChatbotRequest({
          message,
          context,
          userId: 'system'
        });
      } catch (error) {
        console.log('Real AI chatbot failed, using Mock:', error.message);
        return await mockAIService.handleChatbotRequest(message, context);
      }
    } else {
      return await mockAIService.handleChatbotRequest(message, context);
    }
  }

  async categorizeExpense(description: string, vendor?: string): Promise<string> {
    const useReal = await this.checkRealAIAvailability();
    
    if (useReal) {
      try {
        return await backendAIService.categorizeExpense(description, vendor);
      } catch (error) {
        console.log('Real AI categorization failed, using Mock:', error.message);
        return await mockAIService.categorizeExpense(description, vendor);
      }
    } else {
      return await mockAIService.categorizeExpense(description, vendor);
    }
  }

  async validateReceiptQuality(ocrText: string): Promise<{
    isValid: boolean;
    issues: string[];
    confidence: number;
  }> {
    const useReal = await this.checkRealAIAvailability();
    
    if (useReal) {
      try {
        return await backendAIService.validateReceipt({
          text: ocrText,
          userId: 'system'
        });
      } catch (error) {
        console.log('Real AI validation failed, using Mock:', error.message);
        return await mockAIService.validateReceiptQuality(ocrText);
      }
    } else {
      return await mockAIService.validateReceiptQuality(ocrText);
    }
  }

  async listAvailableModels(): Promise<string[]> {
    const useReal = await this.checkRealAIAvailability();
    
    if (useReal) {
      try {
        return await backendAIService.listAvailableModels();
      } catch (error) {
        console.log('Real AI model listing failed, using Mock:', error.message);
        return await mockAIService.listAvailableModels();
      }
    } else {
      return await mockAIService.listAvailableModels();
    }
  }

  async isServiceAvailable(): Promise<boolean> {
    return await this.checkRealAIAvailability();
  }

  getServiceInfo() {
    return {
      available: true, // Always available with fallback
      usingRealAI: this.useRealAI,
      model: this.useRealAI ? 'llama3' : 'mock-ai-model',
      capabilities: [
        "Natural language understanding",
        "Receipt data extraction", 
        "Expense categorization",
        "Financial guidance",
        "System navigation help",
        "Automatic fallback to mock service",
        "Seamless switching between real and mock AI"
      ],
      status: this.useRealAI ? 'Real AI Active' : 'Mock AI Active',
      recommendation: this.useRealAI 
        ? 'Real AI is working perfectly'
        : 'Install Ollama for real AI processing'
    };
  }

  // Force check for real AI
  async forceCheckRealAI(): Promise<boolean> {
    this.lastCheckTime = 0; // Reset timer to force check
    return await this.checkRealAIAvailability();
  }

  // Get detailed status
  getDetailedStatus() {
    return {
      useRealAI: this.useRealAI,
      lastCheckTime: this.lastCheckTime,
      checkInterval: this.checkInterval,
      nextCheckIn: Math.max(0, this.checkInterval - (Date.now() - this.lastCheckTime)),
      recommendation: this.useRealAI 
        ? '✅ Real AI (Ollama) is working'
        : '🔄 Install Ollama: https://ollama.com/download'
    };
  }
}

export const fallbackAIService = new FallbackAIService();
