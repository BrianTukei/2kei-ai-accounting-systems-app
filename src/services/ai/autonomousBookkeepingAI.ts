// Autonomous AI Bookkeeping Engine - Complete Implementation
// Revolutionary self-running accounting system for 2K AI Accounting Systems

import { aiReasoningEngine, AIRequest, AIResponse } from './aiReasoningEngine';
import { contextMemorySystem } from './contextMemorySystem';
import { actionEngine } from './actionEngine';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'invoice' | 'bill';
  vendor?: string;
  client?: string;
  amount: number;
  date: string;
  description: string;
  category?: string;
  paymentMethod?: string;
  accountClassification?: string;
  ocrText?: string;
  receiptImage?: string;
  status: 'pending' | 'processed' | 'duplicate' | 'suspicious';
  confidence: number;
  createdAt: string;
  processedAt?: string;
}

export interface FinancialInsight {
  id: string;
  type: 'revenue' | 'expense' | 'profit' | 'cashflow' | 'risk' | 'opportunity';
  title: string;
  description: string;
  amount?: number;
  percentage?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendation: string;
  category?: string;
  createdAt: string;
}

export interface CashflowPrediction {
  id: string;
  period: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  confidence: number;
  factors: string[];
  risks: string[];
  opportunities: string[];
  createdAt: string;
}

export interface DuplicateDetection {
  isDuplicate: boolean;
  confidence: number;
  originalTransaction?: Transaction;
  reason: string;
  suggestion: string;
}

export interface AutonomousBookkeepingTask {
  id: string;
  type: 'transaction_analysis' | 'categorization' | 'duplicate_detection' | 'financial_analysis' | 'cashflow_prediction';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export class AutonomousBookkeepingAI {
  private userId: string;
  private businessContext: any;
  private financialMetrics: any;
  private categoryMappings: Map<string, string>;
  private vendorMappings: Map<string, string>;

  constructor(userId: string) {
    this.userId = userId;
    this.initializeAutonomousSystem();
  }

  private async initializeAutonomousSystem() {
    console.log('🤖 Autonomous AI Bookkeeping Engine initialized');
    this.businessContext = await contextMemorySystem.buildAIContext(this.userId);
    this.financialMetrics = await contextMemorySystem.getFinancialMetrics(this.userId);
    this.initializeCategoryMappings();
    this.initializeVendorMappings();
  }

  private initializeCategoryMappings() {
    this.categoryMappings = new Map([
      // Transport
      ['uber', 'Transport'], ['bolt', 'Transport'], ['taxify', 'Transport'], ['uber eats', 'Transport'], ['bolt food', 'Transport'], ['taxify eat', 'Transport'], ['ride', 'Transport'], ['taxi', 'Transport'], ['transport', 'Transport'], ['travel', 'Transport'], ['fuel', 'Transport'], ['shell', 'Transport'], ['total', 'Transport'], ['engen', 'Transport'], ['petrol station', 'Transport'], ['gas station', 'Transport'],
      // Food & Restaurants
      ['shoprite', 'Food'], ['nakumatt', 'Food'], ['carrefour', 'Food'], ['naivas', 'Food'], ['tuskys', 'Food'], ['chandarana', 'Food'], ['food', 'Food'], ['restaurant', 'Food'], ['cafe', 'Food'], ['coffee', 'Food'], ['lunch', 'Food'], ['dinner', 'Food'], ['breakfast', 'Food'], ['groceries', 'Food'], ['supermarket', 'Food'],
      // Office Supplies
      ['amazon', 'Office Supplies'], ['jumia', 'Office Supplies'], ['kilimall', 'Office Supplies'], ['office', 'Office Supplies'], ['supplies', 'Office Supplies'], ['stationery', 'Office Supplies'], ['printer', 'Office Supplies'], ['computer', 'Office Supplies'], ['laptop', 'Office Supplies'], ['software', 'Office Supplies'], ['equipment', 'Office Supplies'], ['furniture', 'Office Supplies'],
      // Utilities
      ['mtn', 'Utilities'], ['safaricom', 'Utilities'], ['airtel', 'Utilities'], ['telkom', 'Utilities'], ['kenya power', 'Utilities'], ['kplc', 'Utilities'], ['nairobi water', 'Utilities'], ['water', 'Utilities'], ['electricity', 'Utilities'], ['internet', 'Utilities'], ['phone', 'Utilities'], ['utilities', 'Utilities'], ['mobile money', 'Utilities'],
      // Professional Services
      ['lawyer', 'Professional Services'], ['advocate', 'Professional Services'], ['accountant', 'Professional Services'], ['consultant', 'Professional Services'], ['legal', 'Professional Services'], ['accounting', 'Professional Services'], ['professional services', 'Professional Services'], ['fees', 'Professional Services'],
      // Rent & Property
      ['rent', 'Rent'], ['lease', 'Rent'], ['property', 'Rent'], ['landlord', 'Rent'], ['building', 'Rent'], ['office rent', 'Rent'], ['warehouse', 'Rent'],
      // Subscriptions
      ['netflix', 'Subscriptions'], ['spotify', 'Subscriptions'], ['microsoft', 'Subscriptions'], ['adobe', 'Subscriptions'], ['office 365', 'Subscriptions'], ['subscription', 'Subscriptions'], ['software license', 'Subscriptions'],
      // Banking & Finance
      ['bank', 'Banking'], ['mpesa', 'Banking'], ['equity', 'Banking'], ['kcb', 'Banking'], ['cooperative', 'Banking'], ['ncba', 'Banking'], ['absa', 'Banking'], ['standard chartered', 'Banking'], ['Barclays', 'Banking'], ['citibank', 'Banking'], ['chase', 'Banking'], ['fees', 'Banking'], ['interest', 'Banking'],
      // Marketing & Advertising
      ['facebook', 'Marketing'], ['google', 'Marketing'], ['instagram', 'Marketing'], ['twitter', 'Marketing'], ['linkedin', 'Marketing'], ['advertising', 'Marketing'], ['marketing', 'Marketing'], ['promotion', 'Marketing'],
      // Healthcare
      ['hospital', 'Healthcare'], ['clinic', 'Healthcare'], ['pharmacy', 'Healthcare'], ['doctor', 'Healthcare'], ['medical', 'Healthcare'], ['health', 'Healthcare'], ['insurance', 'Healthcare'],
      // Education
      ['school', 'Education'], ['university', 'Education'], ['college', 'Education'], ['tuition', 'Education'], ['education', 'Education'], ['training', 'Education'],
      // Entertainment
      ['cinema', 'Entertainment'], ['movie', 'Entertainment'], ['theatre', 'Entertainment'], ['entertainment', 'Entertainment'], ['recreation', 'Entertainment']
    ]);
  }

  private initializeVendorMappings() {
    this.vendorMappings = new Map([
      // Common vendors in Africa
      ['safaricom', 'Safaricom'], ['mtn', 'MTN'], ['airtel', 'Airtel'], ['telkom kenya', 'Telkom Kenya'],
      ['shoprite', 'Shoprite'], ['nakumatt', 'Nakumatt'], ['carrefour', 'Carrefour'], ['naivas', 'Naivas'], ['tuskys', 'Tuskys'], ['chandarana', 'Chandarana'],
      ['kplc', 'KPLC'], ['nairobi water', 'Nairobi Water'], ['kenya power', 'Kenya Power'],
      ['equity bank', 'Equity Bank'], ['kcb', 'KCB'], ['cooperative bank', 'Cooperative Bank'], ['ncba', 'NCBA'], ['absa kenya', 'Absa Kenya'],
      ['shell', 'Shell'], ['total', 'Total'], ['engen', 'Engen'], ['petrol station', 'Petrol Station'],
      ['uber', 'Uber'], ['bolt', 'Bolt'], ['taxify', 'Taxify'],
      ['amazon', 'Amazon'], ['jumia', 'Jumia'], ['kilimall', 'Kilimall']
    ]);
  }

  // 1️⃣ AI Transaction Analyzer
  async analyzeTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    try {
      console.log('🔍 Analyzing transaction...');

      const analysisPrompt = `
You are the AI Transaction Analyzer for 2K AI Accounting Systems.

Analyze this transaction data and extract structured information:

Transaction Data:
${JSON.stringify(transactionData, null, 2)}

Extract and return JSON with:
- vendor (business name)
- amount (numeric value)
- category (most appropriate expense category)
- paymentMethod (card, cash, mobile money, bank transfer, etc.)
- accountClassification (asset, liability, equity, revenue, expense)
- confidence (0.0 to 1.0)

Categories to choose from:
- Transport, Food, Office Supplies, Utilities, Equipment, Rent, Subscriptions, Professional Services, Marketing, Healthcare, Education, Entertainment, Banking, Other

Accounting classifications:
- Revenue (income for services/goods)
- Expense (business costs)
- Asset (equipment, inventory)
- Liability (loans, credit)
- Equity (owner investments)

Payment methods:
- Card, Cash, Mobile Money, Bank Transfer, Check, Credit

Be precise and confident in your analysis.`;

      const request: AIRequest = {
        message: analysisPrompt,
        userId: this.userId,
        context: this.businessContext
      };

      const response = await aiReasoningEngine.processRequest(request);
      
      let analysisResult;
      try {
        const jsonMatch = response.reasoning.match(/\{[\s\S]*\}/);
        analysisResult = JSON.parse(jsonMatch[0]);
      } catch (error) {
        throw new Error('Failed to parse transaction analysis');
      }

      const transaction: Transaction = {
        id: transactionData.id || `txn_${Date.now()}`,
        type: transactionData.type || 'expense',
        vendor: analysisResult.vendor || transactionData.vendor || 'Unknown Vendor',
        client: transactionData.client,
        amount: analysisResult.amount || transactionData.amount || 0,
        date: transactionData.date || new Date().toISOString().split('T')[0],
        description: transactionData.description || `${analysisResult.vendor || 'Unknown'} transaction`,
        category: analysisResult.category || 'Other',
        paymentMethod: analysisResult.paymentMethod || transactionData.paymentMethod || 'Unknown',
        accountClassification: analysisResult.accountClassification || 'Expense',
        ocrText: transactionData.ocrText,
        receiptImage: transactionData.receiptImage,
        status: 'pending',
        confidence: analysisResult.confidence || 0.8,
        createdAt: new Date().toISOString()
      };

      console.log(`✅ Transaction analyzed: ${transaction.vendor} - $${transaction.amount} - ${transaction.category}`);
      
      return transaction;
    } catch (error) {
      console.error('❌ Transaction analysis failed:', error);
      throw error;
    }
  }

  // 2️⃣ AI Smart Categorization
  async smartCategorizeTransaction(transaction: Transaction): Promise<string> {
    try {
      console.log('🧠 Smart categorizing transaction...');

      // First try rule-based categorization
      const ruleBasedCategory = this.ruleBasedCategorization(transaction);
      if (ruleBasedCategory) {
        console.log(`✅ Rule-based category: ${ruleBasedCategory}`);
        return ruleBasedCategory;
      }

      // Use AI for complex cases
      const categorizationPrompt = `
Categorize this business transaction into the most appropriate expense category:

Transaction Details:
- Vendor: ${transaction.vendor}
- Description: ${transaction.description}
- Amount: $${transaction.amount}
- Payment Method: ${transaction.paymentMethod}

Available Categories:
- Transport (fuel, rides, travel, vehicle expenses)
- Food (restaurants, groceries, meals, catering)
- Office Supplies (stationery, printer, computer, equipment)
- Utilities (electricity, water, internet, phone)
- Equipment (machinery, tools, hardware)
- Rent (office rent, property lease)
- Subscriptions (software licenses, services)
- Professional Services (legal, accounting, consulting)
- Marketing (advertising, promotion)
- Healthcare (medical, insurance)
- Education (training, tuition)
- Entertainment (recreation, events)
- Banking (fees, interest)
- Other (miscellaneous)

Return only the category name that best fits this transaction.`;

      const request: AIRequest = {
        message: categorizationPrompt,
        userId: this.userId
      };

      const response = await aiReasoningEngine.processRequest(request);
      const aiCategory = response.reasoning.trim();
      
      const finalCategory = this.validateCategory(aiCategory);
      console.log(`✅ AI categorization: ${finalCategory}`);
      
      return finalCategory;
    } catch (error) {
      console.error('❌ Smart categorization failed:', error);
      return 'Other';
    }
  }

  private ruleBasedCategorization(transaction: Transaction): string | null {
    const text = `${transaction.vendor} ${transaction.description}`.toLowerCase();
    
    // Check category mappings
    for (const [keyword, category] of this.categoryMappings) {
      if (text.includes(keyword)) {
        // Map to main categories
        if (category === 'transport' || category === 'fuel' || category === 'taxi' || category === 'ride') {
          return 'Transport';
        }
        if (category === 'food' || category === 'restaurant' || category === 'cafe' || category === 'groceries' || category === 'supermarket') {
          return 'Food';
        }
        if (category === 'office' || category === 'supplies' || category === 'stationery' || category === 'printer' || category === 'computer' || category === 'equipment' || category === 'furniture') {
          return 'Office Supplies';
        }
        if (category === 'utilities' || category === 'water' || category === 'electricity' || category === 'internet' || category === 'phone') {
          return 'Utilities';
        }
        if (category === 'mobile money' || category === 'bank' || category === 'fees' || category === 'interest') {
          return 'Banking';
        }
        if (category === 'subscription' || category === 'software license') {
          return 'Subscriptions';
        }
        if (category === 'professional services' || category === 'legal' || category === 'accounting' || category === 'consultant') {
          return 'Professional Services';
        }
        if (category === 'rent' || category === 'lease' || category === 'property') {
          return 'Rent';
        }
        if (category === 'marketing' || category === 'advertising' || category === 'promotion') {
          return 'Marketing';
        }
        if (category === 'health' || category === 'medical' || category === 'insurance') {
          return 'Healthcare';
        }
        if (category === 'education' || category === 'school' || category === 'university' || category === 'tuition') {
          return 'Education';
        }
        if (category === 'entertainment' || category === 'cinema' || category === 'movie' || category === 'recreation') {
          return 'Entertainment';
        }
      }
    }

    return null;
  }

  private validateCategory(category: string): string {
    const validCategories = [
      'Transport', 'Food', 'Office Supplies', 'Utilities', 'Equipment', 
      'Rent', 'Subscriptions', 'Professional Services', 'Marketing', 
      'Healthcare', 'Education', 'Entertainment', 'Banking', 'Other'
    ];

    const found = validCategories.find(valid => 
      category.toLowerCase().includes(valid.toLowerCase())
    );

    return found || 'Other';
  }

  // 3️⃣ AI Duplicate Detection
  async detectDuplicate(transaction: Transaction): Promise<DuplicateDetection> {
    try {
      console.log('🔍 Detecting duplicates...');

      // In production, this would query the database
      // For now, simulate with recent transactions
      const recentTransactions = await this.getRecentTransactions();
      
      const duplicates = recentTransactions.filter(existing => {
        const amountMatch = Math.abs(existing.amount - transaction.amount) < 1;
        const vendorMatch = existing.vendor?.toLowerCase() === transaction.vendor?.toLowerCase();
        const dateMatch = this.isSameDate(existing.date, transaction.date);
        
        return amountMatch && vendorMatch && dateMatch;
      });

      if (duplicates.length > 0) {
        const duplicate = duplicates[0];
        return {
          isDuplicate: true,
          confidence: 0.9,
          originalTransaction: duplicate,
          reason: `Similar transaction found: ${duplicate.vendor} - $${duplicate.amount} on ${duplicate.date}`,
          suggestion: 'Review this transaction to avoid duplicate entry'
        };
      }

      return {
        isDuplicate: false,
        confidence: 0.95,
        reason: 'No similar transactions found',
        suggestion: 'Transaction appears to be unique'
      };
    } catch (error) {
      console.error('❌ Duplicate detection failed:', error);
      return {
        isDuplicate: false,
        confidence: 0.5,
        reason: 'Error during duplicate detection',
        suggestion: 'Manual review recommended'
      };
    }
  }

  private isSameDate(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  private async getRecentTransactions(): Promise<Transaction[]> {
    // Mock data - in production, fetch from database
    return [
      {
        id: 'txn_001',
        vendor: 'Shell',
        amount: 60,
        date: '2026-03-07',
        description: 'Fuel purchase',
        category: 'Transport',
        paymentMethod: 'Card',
        status: 'processed',
        confidence: 0.9,
        createdAt: '2026-03-07T10:00:00Z'
      },
      {
        id: 'txn_002',
        vendor: 'Shoprite',
        amount: 150,
        date: '2026-03-08',
        description: 'Grocery shopping',
        category: 'Food',
        paymentMethod: 'Card',
        status: 'processed',
        confidence: 0.95,
        createdAt: '2026-03-08T14:00:00Z'
      }
    ];
  }

  // 4️⃣ AI Financial Health Monitor
  async analyzeFinancialHealth(): Promise<FinancialInsight[]> {
    try {
      console.log('📊 Analyzing financial health...');

      const healthPrompt = `
You are the AI Financial Health Monitor for 2K AI Accounting Systems.

Analyze this business financial data and provide insights:

Current Financial Data:
Revenue: $${this.financialMetrics?.monthlyRevenue || 0}
Expenses: $${this.financialMetrics?.monthlyExpenses || 0}
Current Balance: $${this.businessContext?.currentBalance || 0}

Recent Transactions:
${JSON.stringify(this.businessContext?.recentTransactions || [], null, 2)}

Generate 3-5 financial insights with:
- type (revenue, expense, profit, cashflow, risk, opportunity)
- title (short, descriptive)
- description (detailed explanation)
- amount or percentage (relevant numbers)
- trend (increasing, decreasing, stable)
- severity (low, medium, high, critical)
- actionable (true/false)
- recommendation (specific advice)
- category (related expense category if applicable)

Focus on:
1. Expense trends and anomalies
2. Profit margin analysis
3. Cash flow health
4. Cost optimization opportunities
5. Revenue growth patterns

Return JSON array of insights.`;

      const request: AIRequest = {
        message: healthPrompt,
        userId: this.userId,
        context: this.businessContext,
        memory: await contextMemorySystem.buildAIMemory(this.userId)
      };

      const response = await aiReasoningEngine.processRequest(request);
      
      let insights: FinancialInsight[] = [];
      try {
        const jsonMatch = response.reasoning.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedInsights = JSON.parse(jsonMatch[0]);
          insights = parsedInsights.map((insight, index) => ({
            id: `insight_${Date.now()}_${index}`,
            ...insight,
            createdAt: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Failed to parse financial insights:', error);
      }

      // Add default insights if parsing fails
      if (insights.length === 0) {
        insights = this.generateDefaultInsights();
      }

      console.log(`✅ Generated ${insights.length} financial insights`);
      return insights;
    } catch (error) {
      console.error('❌ Financial health analysis failed:', error);
      return this.generateDefaultInsights();
    }
  }

  private generateDefaultInsights(): FinancialInsight[] {
    const revenue = this.financialMetrics?.monthlyRevenue || 0;
    const expenses = this.financialMetrics?.monthlyExpenses || 0;
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return [
      {
        id: 'insight_default_1',
        type: 'profit',
        title: profit >= 0 ? 'Positive Profit Margin' : 'Negative Profit Margin',
        description: `Current profit margin is ${profitMargin.toFixed(1)}%`,
        amount: profit,
        percentage: profitMargin,
        trend: 'stable',
        severity: profit >= 0 ? 'low' : 'high',
        actionable: true,
        recommendation: profit >= 0 ? 'Maintain current expense management' : 'Review and reduce expenses',
        createdAt: new Date().toISOString()
      },
      {
        id: 'insight_default_2',
        type: 'expense',
        title: 'Expense Analysis',
        description: `Monthly expenses total $${expenses}`,
        amount: expenses,
        trend: 'stable',
        severity: expenses > revenue * 0.8 ? 'medium' : 'low',
        actionable: true,
        recommendation: 'Monitor expense trends and optimize where possible',
        createdAt: new Date().toISOString()
      }
    ];
  }

  // 5️⃣ AI Cashflow Predictor
  async predictCashflow(months: number = 1): Promise<CashflowPrediction> {
    try {
      console.log('📈 Predicting cashflow...');

      const predictionPrompt = `
You are the AI Cashflow Predictor for 2K AI Accounting Systems.

Predict cashflow for the next ${months} month(s) using this financial data:

Current Financial Data:
Revenue: $${this.financialMetrics?.monthlyRevenue || 0}
Expenses: $${this.financialMetrics?.monthlyExpenses || 0}
Growth Rate: ${this.financialMetrics?.growthRate || 0}% profit margin
Current Balance: $${this.businessContext?.currentBalance || 0}

Historical Trends:
${JSON.stringify(this.businessContext?.monthlyTrend || [], null, 2)}

Consider:
- Seasonal patterns
- Market trends
- Business growth
- Expense patterns
- Historical performance

Return JSON with:
- projectedRevenue (realistic forecast)
- projectedExpenses (estimated costs)
- projectedProfit (revenue - expenses)
- confidence (0.0 to 1.0)
- factors (array of influencing factors)
- risks (array of potential risks)
- opportunities (array of growth opportunities)

Be realistic and conservative in your projections.`;

      const request: AIRequest = {
        message: predictionPrompt,
        userId: this.userId,
        context: this.businessContext,
        memory: await contextMemorySystem.buildAIMemory(this.userId)
      };

      const response = await aiReasoningEngine.processRequest(request);
      
      let prediction: CashflowPrediction;
      try {
        const jsonMatch = response.reasoning.match(/\{[\s\S]*\}/);
        const parsedPrediction = JSON.parse(jsonMatch[0]);
        
        prediction = {
          id: `prediction_${Date.now()}`,
          period: `Next ${months} month${months > 1 ? 's' : ''}`,
          projectedRevenue: parsedPrediction.projectedRevenue || 0,
          projectedExpenses: parsedPrediction.projectedExpenses || 0,
          projectedProfit: (parsedPrediction.projectedRevenue || 0) - (parsedPrediction.projectedExpenses || 0),
          confidence: parsedPrediction.confidence || 0.7,
          factors: parsedPrediction.factors || [],
          risks: parsedPrediction.risks || [],
          opportunities: parsedPrediction.opportunities || [],
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Failed to parse cashflow prediction:', error);
        prediction = this.generateDefaultPrediction();
      }

      console.log(`✅ Cashflow predicted: $${prediction.projectedProfit} profit`);
      return prediction;
    } catch (error) {
      console.error('❌ Cashflow prediction failed:', error);
      return this.generateDefaultPrediction();
    }
  }

  private generateDefaultPrediction(): CashflowPrediction {
    const revenue = this.financialMetrics?.monthlyRevenue || 0;
    const expenses = this.financialMetrics?.monthlyExpenses || 0;
    const growthRate = this.financialMetrics?.growthRate || 0;

    const projectedRevenue = revenue * (1 + growthRate / 100);
    const projectedExpenses = expenses * 1.05; // Assume 5% expense growth
    const projectedProfit = projectedRevenue - projectedExpenses;

    return {
      id: `prediction_default_${Date.now()}`,
      period: 'Next month',
      projectedRevenue,
      projectedExpenses,
      projectedProfit,
      confidence: 0.6,
      factors: ['Historical trends', 'Market conditions'],
      risks: ['Economic uncertainty', 'Unexpected expenses'],
      opportunities: ['Revenue growth', 'Cost optimization'],
      createdAt: new Date().toISOString()
    };
  }

  // Autonomous Receipt Processing Workflow
  async processReceiptAutonomously(ocrText: string, imageUrl?: string): Promise<Transaction> {
    try {
      console.log('🧾 Autonomous receipt processing...');

      // Step 1: Analyze transaction
      const transaction = await this.analyzeTransaction({
        type: 'expense',
        ocrText,
        receiptImage: imageUrl
      });

      // Step 2: Smart categorization
      transaction.category = await this.smartCategorizeTransaction(transaction);

      // Step 3: Duplicate detection
      const duplicateCheck = await this.detectDuplicate(transaction);
      if (duplicateCheck.isDuplicate) {
        transaction.status = 'duplicate';
        console.log('⚠️ Duplicate detected:', duplicateCheck.reason);
      }

      // Step 4: Create accounting entry automatically
      if (transaction.status === 'pending') {
        await this.createAccountingEntry(transaction);
        transaction.status = 'processed';
      }

      transaction.processedAt = new Date().toISOString();
      
      console.log(`✅ Receipt processed autonomously: ${transaction.vendor} - $${transaction.amount}`);
      
      return transaction;
    } catch (error) {
      console.error('❌ Autonomous receipt processing failed:', error);
      throw error;
    }
  }

  private async createAccountingEntry(transaction: Transaction): Promise<void> {
    const action = {
      type: 'create_expense' as const,
      parameters: {
        vendor: transaction.vendor,
        amount: transaction.amount,
        category: transaction.category,
        currency: 'USD',
        date: transaction.date,
        description: transaction.description,
        receipt: transaction.receiptImage
      },
      confidence: 0.9
    };

    // Import actionEngine dynamically to avoid circular dependencies
    const { actionEngine } = await import('./actionEngine');
    await actionEngine.executeAction(action);
    console.log(`📝 Accounting entry created: ${transaction.vendor} - $${transaction.amount}`);
  }

  // Autonomous Bookkeeping Orchestrator
  async runAutonomousBookkeeping(): Promise<AutonomousBookkeepingTask[]> {
    try {
      console.log('🤖 Running autonomous bookkeeping...');

      const tasks: AutonomousBookkeepingTask[] = [];

      // Task 1: Process pending transactions
      tasks.push(await this.processPendingTransactions());

      // Task 2: Analyze financial health
      tasks.push(await this.analyzeFinancialHealthTask());

      // Task 3: Update cashflow predictions
      tasks.push(await this.updateCashflowPredictions());

      // Task 4: Generate insights and alerts
      tasks.push(await this.generateInsightsAndAlerts());

      // Task 5: Update reports automatically
      tasks.push(await this.updateReportsAutomatically());

      return tasks;
    } catch (error) {
      console.error('❌ Autonomous bookkeeping failed:', error);
      throw error;
    }
  }

  private async processPendingTransactions(): Promise<AutonomousBookkeepingTask> {
    const task: AutonomousBookkeepingTask = {
      id: 'task_transactions_' + Date.now(),
      type: 'transaction_analysis',
      status: 'processing',
      data: { pendingTransactions: [] },
      createdAt: new Date().toISOString()
    };

    try {
      // In production, fetch pending transactions from database
      const pendingTransactions = await this.getPendingTransactions();
      
      for (const transaction of pendingTransactions) {
        await this.processReceiptAutonomously(transaction.ocrText, transaction.receiptImage);
      }

      task.status = 'completed';
      task.result = { processedTransactions: pendingTransactions.length };
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }

    return task;
  }

  private async analyzeFinancialHealthTask(): Promise<AutonomousBookkeepingTask> {
    const task: AutonomousBookkeepingTask = {
      id: 'task_health_' + Date.now(),
      type: 'financial_analysis',
      status: 'processing',
      data: {},
      createdAt: new Date().toISOString()
    };

    try {
      const insights = await this.analyzeFinancialHealth();
      
      // Store insights in memory system
      for (const insight of insights) {
        await contextMemorySystem.addBusinessInsight(this.userId, insight);
      }

      task.status = 'completed';
      task.result = { insights: insights.length, topInsight: insights[0] };
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }

    return task;
  }

  private async updateCashflowPredictions(): Promise<AutonomousBookkeepingTask> {
    const task: AutonomousBookkeepingTask = {
      id: 'task_cashflow_' + Date.now(),
      type: 'cashflow_prediction',
      status: 'processing',
      data: {},
      createdAt: new Date().toISOString()
    };

    try {
      const prediction = await this.predictCashflow(3);
      
      // Store prediction in memory system
      await contextMemorySystem.addBusinessInsight(this.userId, {
        type: 'cashflow',
        title: 'Cashflow Projection',
        description: `Projected profit: $${prediction.projectedProfit}`,
        amount: prediction.projectedProfit,
        createdAt: new Date().toISOString()
      });

      task.status = 'completed';
      task.result = { prediction };
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }

    return task;
  }

  private async generateInsightsAndAlerts(): Promise<AutonomousBookkeepingTask> {
    const task: AutonomousBookkeepingTask = {
      id: 'task_insights_' + Date.now(),
      type: 'financial_analysis',
      status: 'processing',
      data: {},
      createdAt: new Date().toISOString()
    };

    try {
      const insights = await this.analyzeFinancialHealth();
      
      // Generate alerts for critical insights
      const criticalInsights = insights.filter(insight => 
        insight.severity === 'high' || insight.severity === 'critical'
      );

      if (criticalInsights.length > 0) {
        // In production, send alerts to user
        console.log(`🚨 ${criticalInsights.length} critical insights detected`);
      }

      task.status = 'completed';
      task.result = { insights: insights.length, criticalAlerts: criticalInsights.length };
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }

    return task;
  }

  private async updateReportsAutomatically(): Promise<AutonomousBookkeepingTask> {
    const task: AutonomousBookkeepingTask = {
      id: 'task_reports_' + Date.now(),
      type: 'financial_analysis',
      status: 'processing',
      data: {},
      createdAt: new Date().toISOString()
    };

    try {
      // In production, generate and save reports
      const reportData = await this.generateMonthlyReport();
      
      task.status = 'completed';
      task.result = { reportGenerated: true, reportData };
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }

    return task;
  }

  private async getPendingTransactions(): Promise<any[]> {
    // Mock data - in production, fetch from database
    return [
      {
        id: 'pending_001',
        ocrText: 'STARBUCKS\nCoffee $5.50\nCroissant $3.50\nTotal $9.00',
        receiptImage: 'receipt_image_001.jpg'
      }
    ];
  }

  private async generateMonthlyReport(): Promise<any> {
    const revenue = this.financialMetrics?.monthlyRevenue || 0;
    const expenses = this.financialMetrics?.monthlyExpenses || 0;
    const profit = revenue - expenses;

    return {
      period: new Date().toISOString().split('T')[0],
      revenue,
      expenses,
      profit,
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
      generatedAt: new Date().toISOString()
    };
  }

  // Public API methods
  async getAutonomousStatus(): Promise<any> {
    return {
      status: 'operational',
      features: {
        transactionAnalysis: true,
        smartCategorization: true,
        duplicateDetection: true,
        financialHealthMonitoring: true,
        cashflowPrediction: true,
        autonomousReceiptProcessing: true,
        automaticReportGeneration: true
      },
      lastRun: new Date().toISOString(),
      nextScheduledRun: this.getNextScheduledRun()
    };
  }

  private getNextScheduledRun(): string {
    const now = new Date();
    const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    return nextRun.toISOString();
  }
}

export default AutonomousBookkeepingAI;
