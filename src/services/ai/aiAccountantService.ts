import { localAIService } from './localAIService';
import { currencyService } from '../currencyService';
import { userCompanyService } from '../userCompanyService';

export interface FinancialData {
  revenue: number;
  expenses: number;
  bills: number;
  invoices: number;
  transactions: TransactionData[];
  period: string;
}

export interface TransactionData {
  id: string;
  type: 'expense' | 'revenue' | 'bill' | 'invoice';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  merchant?: string;
  items?: Array<{
    name: string;
    price: number;
    category: string;
  }>;
}

export interface FinancialInsight {
  type: 'warning' | 'opportunity' | 'trend' | 'recommendation';
  title: string;
  description: string;
  amount?: number;
  percentage?: number;
  action?: string;
}

export interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    expenseGrowth: number;
    revenueGrowth: number;
  };
  insights: FinancialInsight[];
  recommendations: string[];
  trends: {
    category: string;
    amount: number;
    change: number;
  }[];
  period: string;
}

export interface AccountingMistake {
  type: 'duplicate' | 'unusual' | 'missing' | 'risk' | 'categorization';
  severity: 'low' | 'medium' | 'high';
  description: string;
  amount?: number;
  suggestion: string;
  relatedTransactions?: string[];
}

class AIAccountantService {
  private systemPrompt = `You are the AI Accountant for 2K AI Accounting Systems, a comprehensive accounting platform designed for African businesses.

Your role is to provide intelligent financial analysis, detect accounting mistakes, and generate professional reports.

🏗️ **System Architecture:**
- Dashboard – Financial overview and key metrics
- Invoices – Create and manage customer invoices  
- Expenses – Track and categorize business expenses
- Bills – Manage supplier bills and payments
- Reports – Generate financial reports and analytics
- Teams – Manage staff roles and permissions
- Receipt Scanner – AI-powered receipt processing
- Currency Converter – Multi-currency support (UGX, KES, TZS, RWF, etc.)

💱 **Currency Features:**
- Support for 30+ African and international currencies
- Automatic currency detection and conversion
- Real-time exchange rate updates
- Dual-currency reporting

🧠 **AI Capabilities:**
- Receipt scanning with OCR and data extraction
- Automatic expense categorization
- Financial mistake detection
- Trend analysis and forecasting
- Tax estimation and compliance
- Fraud detection and risk assessment

📊 **Analysis Focus:**
- Cash flow management
- Expense optimization
- Revenue growth analysis
- Profit margin improvement
- Budget adherence
- Seasonal trends

🎯 **Business Context:**
- SME-focused accounting solutions
- Mobile money integration (M-Pesa, Airtel Money, etc.)
- African market expertise
- Regulatory compliance
- Multi-language support

When analyzing financial data, always:
1. Consider African business context
2. Account for currency fluctuations
3. Identify local market trends
4. Provide actionable recommendations
5. Highlight regulatory considerations

Format responses professionally with clear sections, bullet points, and specific monetary amounts.`;

  async analyzeFinancialData(data: FinancialData): Promise<FinancialReport> {
    const prompt = `
${this.systemPrompt}

Please analyze this financial data and generate a comprehensive report:

**Financial Data for ${data.period}:**
- Total Revenue: ${currencyService.formatAmount(data.revenue, 'USD')}
- Total Expenses: ${currencyService.formatAmount(data.expenses, 'USD')}
- Outstanding Bills: ${currencyService.formatAmount(data.bills, 'USD')}
- Unpaid Invoices: ${currencyService.formatAmount(data.invoices, 'USD')}

**Recent Transactions (${data.transactions.length}):**
${data.transactions.slice(0, 20).map(t => 
  `- ${t.type.toUpperCase()}: ${currencyService.formatAmount(t.amount, t.currency)} - ${t.description} (${t.category})`
).join('\n')}

Please provide:
1. Executive Summary with key metrics
2. 5-7 Financial Insights (warnings, opportunities, trends)
3. 3-4 Actionable Recommendations
4. Top spending categories with trends
5. Cash flow analysis

Format as JSON:
{
  "summary": {
    "totalRevenue": number,
    "totalExpenses": number, 
    "netProfit": number,
    "profitMargin": number,
    "expenseGrowth": number,
    "revenueGrowth": number
  },
  "insights": [
    {
      "type": "warning|opportunity|trend|recommendation",
      "title": "string",
      "description": "string",
      "amount": number,
      "percentage": number,
      "action": "string"
    }
  ],
  "recommendations": ["string"],
  "trends": [
    {
      "category": "string",
      "amount": number,
      "change": number
    }
  ],
  "period": "string"
}`;

    try {
      const response = await localAIService.generateResponse(prompt, {
        temperature: 0.3,
        max_tokens: 2000
      });

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return this.generateFallbackReport(data);
    } catch (error) {
      console.error('Financial analysis failed:', error);
      return this.generateFallbackReport(data);
    }
  }

  async detectAccountingMistakes(transactions: TransactionData[]): Promise<AccountingMistake[]> {
    const prompt = `
${this.systemPrompt}

Please review these financial transactions and detect potential accounting mistakes, errors, or risks:

**Transactions (${transactions.length}):**
${transactions.slice(0, 50).map(t => 
  `ID: ${t.id}
  Type: ${t.type}
  Amount: ${currencyService.formatAmount(t.amount, t.currency)}
  Category: ${t.category}
  Description: ${t.description}
  Date: ${t.date}
  Merchant: ${t.merchant || 'N/A'}
  Items: ${t.items?.map(i => `${i.name} (${i.category})`).join(', ') || 'N/A'}`
).join('\n\n')}

Check for:
- Duplicate expenses or transactions
- Unusual spending patterns
- Missing invoice payments
- Potential fraud or errors
- Incorrect categorization
- Cash flow risks
- Tax compliance issues

For each issue found, provide:
- Type of mistake (duplicate, unusual, missing, risk, categorization)
- Severity level (low, medium, high)
- Detailed description
- Amount involved (if applicable)
- Suggested action
- Related transaction IDs

Format as JSON array:
[
  {
    "type": "duplicate|unusual|missing|risk|categorization",
    "severity": "low|medium|high", 
    "description": "string",
    "amount": number,
    "suggestion": "string",
    "relatedTransactions": ["string"]
  }
]`;

    try {
      const response = await localAIService.generateResponse(prompt, {
        temperature: 0.2,
        max_tokens: 1500
      });

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error('Mistake detection failed:', error);
      return [];
    }
  }

  async generateFinancialAdvice(
    financialData: FinancialData, 
    userGoals: string[] = [],
    businessContext: string = ''
  ): Promise<string> {
    const prompt = `
${this.systemPrompt}

Provide personalized financial advice based on this data:

**Current Financial Status:**
- Revenue: ${currencyService.formatAmount(financialData.revenue, 'USD')}
- Expenses: ${currencyService.formatAmount(financialData.expenses, 'USD')}
- Net Profit: ${currencyService.formatAmount(financialData.revenue - financialData.expenses, 'USD')}
- Profit Margin: ${((financialData.revenue - financialData.expenses) / financialData.revenue * 100).toFixed(1)}%

**User Goals:**
${userGoals.map(goal => `- ${goal}`).join('\n') || '- Not specified'}

**Business Context:**
${businessContext || 'General SME business'}

**Top Expense Categories:**
${this.getTopCategories(financialData.transactions).map(cat => 
  `- ${cat.category}: ${currencyService.formatAmount(cat.amount, 'USD')}`
).join('\n')}

Please provide:
1. Assessment of current financial health
2. Specific recommendations to achieve goals
3. Areas for cost optimization
4. Revenue improvement suggestions
5. Risk mitigation strategies
6. Action plan with priorities

Focus on practical, actionable advice for African SMEs considering:
- Local market conditions
- Currency fluctuations
- Regulatory environment
- Access to financing
- Mobile money integration`;

    try {
      return await localAIService.generateResponse(prompt, {
        temperature: 0.4,
        max_tokens: 1800
      });
    } catch (error) {
      console.error('Financial advice generation failed:', error);
      return 'Unable to generate financial advice at this time. Please try again later.';
    }
  }

  async analyzeInvoiceData(invoiceData: any): Promise<{
    companyInfo: string;
    amount: number;
    dueDate: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const prompt = `
${this.systemPrompt}

Analyze this invoice data and extract key information:

${JSON.stringify(invoiceData, null, 2)}

Extract:
- Company name and contact information
- Total amount and currency
- Due date and payment terms
- Line items with descriptions and quantities
- Risk assessment (low/medium/high) based on amount and terms
- Recommendations for payment processing

Format as JSON:
{
  "companyInfo": "string",
  "amount": number,
  "dueDate": "string", 
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "riskLevel": "low|medium|high",
  "recommendations": ["string"]
}`;

    try {
      const response = await localAIService.generateResponse(prompt, {
        temperature: 0.2,
        max_tokens: 1000
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackInvoiceAnalysis(invoiceData);
    } catch (error) {
      console.error('Invoice analysis failed:', error);
      return this.generateFallbackInvoiceAnalysis(invoiceData);
    }
  }

  async generateTaxEstimate(
    financialData: FinancialData,
    country: string = 'UG',
    businessType: string = 'sole_proprietor'
  ): Promise<{
    estimatedTax: number;
    taxRate: number;
    deductions: Array<{ category: string; amount: string; description: string }>;
    recommendations: string[];
    deadline: string;
  }> {
    const prompt = `
${this.systemPrompt}

Generate a tax estimate for this business:

**Financial Data:**
- Revenue: ${currencyService.formatAmount(financialData.revenue, 'USD')}
- Expenses: ${currencyService.formatAmount(financialData.expenses, 'USD')}
- Net Profit: ${currencyService.formatAmount(financialData.revenue - financialData.expenses, 'USD')}

**Business Details:**
- Country: ${country}
- Business Type: ${businessType}
- Period: ${financialData.period}

Consider local tax laws and regulations for ${country}. Provide:
- Estimated tax liability
- Applicable tax rate
- Potential deductions
- Tax-saving recommendations
- Filing deadline

Format as JSON:
{
  "estimatedTax": number,
  "taxRate": number,
  "deductions": [
    {
      "category": "string",
      "amount": "string", 
      "description": "string"
    }
  ],
  "recommendations": ["string"],
  "deadline": "string"
}`;

    try {
      const response = await localAIService.generateResponse(prompt, {
        temperature: 0.3,
        max_tokens: 1200
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackTaxEstimate(financialData, country);
    } catch (error) {
      console.error('Tax estimation failed:', error);
      return this.generateFallbackTaxEstimate(financialData, country);
    }
  }

  private getTopCategories(transactions: TransactionData[]): Array<{ category: string; amount: number; change: number }> {
    const categoryTotals = transactions.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount, change: 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  private generateFallbackReport(data: FinancialData): FinancialReport {
    const netProfit = data.revenue - data.expenses;
    const profitMargin = data.revenue > 0 ? (netProfit / data.revenue) * 100 : 0;

    return {
      summary: {
        totalRevenue: data.revenue,
        totalExpenses: data.expenses,
        netProfit,
        profitMargin,
        expenseGrowth: 0,
        revenueGrowth: 0
      },
      insights: [
        {
          type: 'trend',
          title: 'Current Performance',
          description: `Your profit margin is ${profitMargin.toFixed(1)}%`,
          amount: netProfit,
          percentage: profitMargin
        }
      ],
      recommendations: [
        'Review expenses for optimization opportunities',
        'Focus on revenue growth strategies',
        'Monitor cash flow regularly'
      ],
      trends: this.getTopCategories(data.transactions),
      period: data.period
    };
  }

  private generateFallbackInvoiceAnalysis(invoiceData: any) {
    return {
      companyInfo: 'Analysis unavailable',
      amount: 0,
      dueDate: new Date().toISOString(),
      lineItems: [],
      riskLevel: 'medium' as const,
      recommendations: ['Review invoice details manually']
    };
  }

  private generateFallbackTaxEstimate(data: FinancialData, country: string) {
    const netProfit = data.revenue - data.expenses;
    const estimatedTax = netProfit * 0.3; // 30% fallback rate

    return {
      estimatedTax,
      taxRate: 30,
      deductions: [
        {
          category: 'Business Expenses',
          amount: currencyService.formatAmount(data.expenses, 'USD'),
          description: 'Standard business expense deduction'
        }
      ],
      recommendations: [
        'Consult with a tax professional for accurate calculations',
        'Maintain proper documentation for all expenses',
        'Consider tax planning strategies'
      ],
      deadline: 'End of fiscal year'
    };
  }
}

export const aiAccountantService = new AIAccountantService();
