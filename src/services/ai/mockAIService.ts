// Mock AI Service — powered by the 2KEI Financial Intelligence Engine
// Provides rich, data-driven responses even without an external LLM (Ollama).
import { AIAssistantService } from '@/services/aiAssistant';
import { classifyExpense } from './expenseClassifier';

export interface MockAIResponse {
  response: string;
  model: string;
  timestamp: string;
  processingTime: number;
}

export interface MockExtractedReceiptData {
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

class MockAIService {
  private isAvailable = true;
  private model = "2kei-local-engine";

  // Sample receipt data for demonstration
  private mockReceipts = [
    {
      vendor: "Shoprite Supermarket",
      date: new Date().toISOString().slice(0, 10),
      items: [
        { name: "Milk", price: 5.99, quantity: 1 },
        { name: "Bread", price: 3.49, quantity: 1 },
        { name: "Eggs", price: 4.99, quantity: 1 }
      ],
      total: 14.47,
      currency: "USD",
      category: "Food & Meals",
      confidence: 0.95
    },
    {
      vendor: "Office Depot",
      date: new Date().toISOString().slice(0, 10),
      items: [
        { name: "Notebooks", price: 12.99, quantity: 2 },
        { name: "Pens", price: 8.99, quantity: 1 }
      ],
      total: 34.97,
      currency: "USD",
      category: "Office Supplies",
      confidence: 0.92
    },
    {
      vendor: "Shell Gas Station",
      date: new Date().toISOString().slice(0, 10),
      items: [
        { name: "Gasoline", price: 45.00, quantity: 1 }
      ],
      total: 45.00,
      currency: "USD",
      category: "Transport & Fuel",
      confidence: 0.88
    }
  ];

  async isServiceAvailable(): Promise<boolean> {
    return this.isAvailable;
  }

  /**
   * Generate a response using the 2KEI Financial Intelligence Engine.
   * Options may carry financialSnapshot, contextType, contextData, and userName
   * so the engine can produce data-driven answers.
   */
  async generateResponse(prompt: string, options?: any): Promise<MockAIResponse> {
    const startTime = Date.now();

    // Minimal simulated latency
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));

    const response = AIAssistantService.generateLocalResponse(
      prompt,
      options?.contextType,
      options?.contextData,
      options?.financialSnapshot,
      options?.userName,
    );

    return {
      response,
      model: this.model,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  }

  async extractReceiptData(ocrText: string): Promise<MockExtractedReceiptData> {
    // Simulate OCR processing time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // Try to extract vendor name from OCR text
    const vendorMatch = ocrText.match(/(?:from|at|vendor|store)[:\s]+([^\n,]+)/i);
    const vendor = vendorMatch ? vendorMatch[1].trim() : this.mockReceipts[Math.floor(Math.random() * this.mockReceipts.length)].vendor;

    // Try to extract total amount
    const totalMatch = ocrText.match(/(?:total|amount|sum)[:\s]*\$?([\d,]+(?:\.\d{1,2})?)/i);
    const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : this.mockReceipts[0].total;

    // Use the expense classifier to determine category
    const classification = classifyExpense(ocrText, total);

    const base = this.mockReceipts[Math.floor(Math.random() * this.mockReceipts.length)];
    return {
      ...base,
      vendor,
      total,
      category: classification.category,
      date: new Date().toISOString().slice(0, 10),
      confidence: 0.80 + Math.random() * 0.18,
    };
  }

  /**
   * Handle a chatbot request using the full 2KEI AI engine.
   * Context may carry financialSnapshot and other metadata.
   */
  async handleChatbotRequest(message: string, context?: any): Promise<string> {
    return AIAssistantService.generateLocalResponse(
      message,
      context?.contextType,
      context?.contextData,
      context?.financialSnapshot,
      context?.userName,
    );
  }

  async categorizeExpense(description: string, vendor?: string): Promise<string> {
    const text = vendor ? `${description} ${vendor}` : description;
    const classification = classifyExpense(text);
    return classification.category;
  }

  async validateReceiptQuality(ocrText: string): Promise<{
    isValid: boolean;
    issues: string[];
    confidence: number;
  }> {
    const issues: string[] = [];
    let confidence = 1.0;

    if (ocrText.length < 10) {
      issues.push("Receipt text is too short");
      confidence -= 0.4;
    }

    if (!/\d/.test(ocrText)) {
      issues.push("No numbers found in receipt text");
      confidence -= 0.3;
    }

    if (!ocrText.toLowerCase().includes("total") && !ocrText.toLowerCase().includes("amount")) {
      issues.push("No total amount detected");
      confidence -= 0.2;
    }

    if (ocrText.length > 2000) {
      issues.push("Receipt text is very long, may contain errors");
      confidence -= 0.1;
    }

    return {
      isValid: confidence > 0.5,
      issues,
      confidence: Math.max(0, confidence)
    };
  }

  async listAvailableModels(): Promise<string[]> {
    return [this.model, "mock-small", "mock-medium", "mock-large"];
  }

  getServiceInfo() {
    return {
      available: this.isAvailable,
      model: this.model,
      capabilities: [
        "Natural language understanding",
        "Receipt data extraction",
        "Expense categorization",
        "Financial guidance",
        "System navigation help"
      ],
      limitations: [
        "Mock service for demonstration",
        "Pre-programmed responses",
        "No real AI processing"
      ]
    };
  }
}

export const mockAIService = new MockAIService();
