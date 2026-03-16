// Mock AI Service for demonstration when Ollama is not available
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
  private model = "mock-ai-model";

  // Mock receipt data for demonstration
  private mockReceipts = [
    {
      vendor: "Shoprite Supermarket",
      date: "2026-03-05",
      items: [
        { name: "Milk", price: 5.99, quantity: 1 },
        { name: "Bread", price: 3.49, quantity: 1 },
        { name: "Eggs", price: 4.99, quantity: 1 }
      ],
      total: 14.47,
      currency: "USD",
      category: "Food",
      confidence: 0.95
    },
    {
      vendor: "Office Depot",
      date: "2026-03-04",
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
      date: "2026-03-04",
      items: [
        { name: "Gasoline", price: 45.00, quantity: 1 }
      ],
      total: 45.00,
      currency: "USD",
      category: "Transport",
      confidence: 0.88
    }
  ];

  // Mock chatbot responses
  private mockResponses = [
    "I can help you with that! Go to Dashboard → Reports → Select the report you want to view.",
    "To create an invoice, go to the Invoices module and click 'Add Invoice'. Enter the client details and amount.",
    "For expenses, navigate to the Expenses module and click 'Add Expense'. Fill in the vendor, amount, and category.",
    "Your financial summary is available in the Dashboard. It shows revenue, expenses, and profit trends.",
    "To scan receipts, use the AI Receipt Scanner feature. Upload your receipt image and AI will extract the data.",
    "For client management, go to the Clients module to add, edit, or view client information.",
    "Reports can be generated from the Reports section. Choose from profit loss, balance sheet, or cash flow.",
    "To view unpaid invoices, go to Invoices and filter by 'Unpaid' status.",
    "For expense categorization, the AI can automatically suggest categories based on vendor and item types.",
    "Your dashboard shows key metrics including total revenue, expenses, profit margin, and recent transactions."
  ];

  async isServiceAvailable(): Promise<boolean> {
    return this.isAvailable;
  }

  async generateResponse(prompt: string, options?: any): Promise<MockAIResponse> {
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    let response = "";
    const lowerPrompt = prompt.toLowerCase();

    // Generate contextual responses based on prompt
    if (lowerPrompt.includes("invoice")) {
      response = "I can help you create invoices! Go to the Invoices module and click 'Add Invoice'. Enter the client name, amount, and due date. The AI can also help categorize and track payments.";
    } else if (lowerPrompt.includes("expense")) {
      response = "For expenses, navigate to the Expenses module and click 'Add Expense'. You can manually enter details or use the AI Receipt Scanner to automatically extract data from receipts.";
    } else if (lowerPrompt.includes("report")) {
      response = "Reports are available in the Reports section. You can generate Profit & Loss statements, Balance Sheets, and Cash Flow reports. Choose your date range and click 'Generate'.";
    } else if (lowerPrompt.includes("dashboard")) {
      response = "Your Dashboard provides a complete financial overview with key metrics, recent transactions, and quick access to all modules. Check it daily for updates.";
    } else if (lowerPrompt.includes("client")) {
      response = "Manage clients in the Clients module. You can add new clients, edit existing ones, and view their transaction history and outstanding balances.";
    } else if (lowerPrompt.includes("receipt")) {
      response = "Use the AI Receipt Scanner to process receipts. Upload an image and AI will extract vendor, date, items, and total amount automatically.";
    } else if (lowerPrompt.includes("where") || lowerPrompt.includes("find")) {
      response = this.mockResponses[Math.floor(Math.random() * this.mockResponses.length)];
    } else if (lowerPrompt.includes("how")) {
      response = "I can guide you step-by-step! Tell me what you want to do, and I'll provide detailed instructions for navigating the system.";
    } else if (lowerPrompt.includes("help")) {
      response = "I'm here to help! I can assist with navigating modules, creating invoices/expenses, generating reports, analyzing finances, and using AI features. What would you like help with?";
    } else {
      response = "I'm your 2K AI Assistant! I can help you navigate the accounting system, create invoices, manage expenses, generate reports, and provide financial insights. What would you like to do?";
    }

    const processingTime = Date.now() - startTime;

    return {
      response,
      model: this.model,
      timestamp: new Date().toISOString(),
      processingTime
    };
  }

  async extractReceiptData(ocrText: string): Promise<MockExtractedReceiptData> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Return a random mock receipt
    const mockReceipt = this.mockReceipts[Math.floor(Math.random() * this.mockReceipts.length)];
    
    return {
      ...mockReceipt,
      confidence: 0.85 + Math.random() * 0.15 // Random confidence between 85-100%
    };
  }

  async handleChatbotRequest(message: string, context?: any): Promise<string> {
    const response = await this.generateResponse(message);
    return response.response;
  }

  async categorizeExpense(description: string, vendor?: string): Promise<string> {
    const categories = ["Food", "Transport", "Office Supplies", "Utilities", "Equipment", "Subscriptions", "Other"];
    
    // Simple categorization logic
    const lowerDesc = description.toLowerCase();
    const lowerVendor = vendor?.toLowerCase() || "";
    
    if (lowerDesc.includes("food") || lowerDesc.includes("restaurant") || lowerVendor.includes("restaurant")) {
      return "Food";
    } else if (lowerDesc.includes("gas") || lowerDesc.includes("fuel") || lowerVendor.includes("shell") || lowerVendor.includes("petrol")) {
      return "Transport";
    } else if (lowerDesc.includes("office") || lowerDesc.includes("stationery") || lowerVendor.includes("office")) {
      return "Office Supplies";
    } else if (lowerDesc.includes("electric") || lowerDesc.includes("water") || lowerDesc.includes("internet")) {
      return "Utilities";
    } else if (lowerDesc.includes("software") || lowerDesc.includes("subscription")) {
      return "Subscriptions";
    } else if (lowerDesc.includes("computer") || lowerDesc.includes("equipment")) {
      return "Equipment";
    }
    
    return "Other";
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
