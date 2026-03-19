/**
 * Advanced Reasoning Engine
 * ────────────────────────────────────────────────────────────────────────────
 * Sophisticated AI reasoning system with multi-step analysis,
 * contextual understanding, and intelligent decision making.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIContext, AIResponse, FinancialSnapshot } from './types';
import { detectMode, getModeSystemContext } from './modes';

// ── Reasoning Types ─────────────────────────────────────────────────────────

export interface ReasoningStep {
  id: string;
  type: 'analysis' | 'calculation' | 'comparison' | 'inference' | 'recommendation';
  description: string;
  input: any;
  output: any;
  confidence: number;
  reasoning: string;
  timestamp: Date;
  context?: any;
}

export interface ReasoningChain {
  id: string;
  context: AIContext;
  steps: ReasoningStep[];
  conclusion: string;
  confidence: number;
  processingTime: number;
  metadata: {
    mode: string;
    dataSources: string[];
    assumptions: string[];
    limitations: string[];
  };
}

export interface FinancialAnalysis {
  profitability: {
    grossMargin: number;
    netMargin: number;
    operatingMargin: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  efficiency: {
    expenseRatio: number;
    revenuePerEmployee: number;
    assetTurnover: number;
  };
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRunway: number;
  };
  growth: {
    revenueGrowth: number;
    profitGrowth: number;
    marketExpansion: number;
  };
  risk: {
    dependencyScore: number;
    volatilityIndex: number;
    leverage: number;
  };
}

export interface BusinessInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'short_term' | 'long_term';
  actionability: 'easy' | 'moderate' | 'complex';
  evidence: string[];
}

// ── Advanced Analysis Engine ─────────────────────────────────────────────────

class AdvancedAnalysisEngine {
  private industryBenchmarks = new Map([
    ['gross_margin', 0.40],
    ['net_margin', 0.10],
    ['current_ratio', 2.0],
    ['revenue_growth', 0.15],
    ['expense_ratio', 0.85],
  ]);

  analyzeFinancialHealth(snapshot: FinancialSnapshot): FinancialAnalysis {
    const revenue = snapshot.monthlyIncome;
    const expenses = snapshot.monthlyExpenses;
    const grossProfit = revenue * 0.6; // Assuming 60% gross margin
    const netProfit = revenue - expenses;

    return {
      profitability: {
        grossMargin: revenue > 0 ? grossProfit / revenue : 0,
        netMargin: revenue > 0 ? netProfit / revenue : 0,
        operatingMargin: revenue > 0 ? (grossProfit - expenses * 0.8) / revenue : 0,
        trend: this.calculateTrend(snapshot),
      },
      efficiency: {
        expenseRatio: revenue > 0 ? expenses / revenue : 1,
        revenuePerEmployee: revenue / 10, // Assuming 10 employees
        assetTurnover: revenue / 100000, // Assuming $100k assets
      },
      liquidity: {
        currentRatio: snapshot.totalBalance / (expenses * 0.5),
        quickRatio: (snapshot.totalBalance - expenses * 0.2) / (expenses * 0.5),
        cashRunway: expenses > 0 ? snapshot.totalBalance / expenses : 0,
      },
      growth: {
        revenueGrowth: snapshot.incomeGrowth,
        profitGrowth: this.calculateProfitGrowth(snapshot),
        marketExpansion: snapshot.incomeGrowth * 0.8,
      },
      risk: {
        dependencyScore: this.calculateDependencyScore(snapshot),
        volatilityIndex: this.calculateVolatility(snapshot),
        leverage: 0.3, // Assuming 30% debt ratio
      },
    };
  }

  generateBusinessInsights(analysis: FinancialAnalysis, context: AIContext): BusinessInsight[] {
    const insights: BusinessInsight[] = [];

    // Profitability Analysis
    if (analysis.profitability.netMargin < 0.05) {
      insights.push({
        type: 'weakness',
        area: 'Profitability',
        description: 'Net profit margin is below 5%, indicating pricing or cost issues',
        impact: 'high',
        urgency: 'immediate',
        actionability: 'moderate',
        evidence: [`Current net margin: ${(analysis.profitability.netMargin * 100).toFixed(1)}%`],
      });
    }

    if (analysis.profitability.netMargin > 0.15) {
      insights.push({
        type: 'strength',
        area: 'Profitability',
        description: 'Excellent profit margins indicate strong pricing power',
        impact: 'high',
        urgency: 'long_term',
        actionability: 'easy',
        evidence: [`Current net margin: ${(analysis.profitability.netMargin * 100).toFixed(1)}%`],
      });
    }

    // Liquidity Analysis
    if (analysis.liquidity.cashRunway < 3) {
      insights.push({
        type: 'threat',
        area: 'Liquidity',
        description: `Cash runway of ${analysis.liquidity.cashRunway.toFixed(1)} months is critical`,
        impact: 'high',
        urgency: 'immediate',
        actionability: 'complex',
        evidence: [`Current cash balance: $${context.financialSnapshot?.totalBalance.toLocaleString()}`],
      });
    }

    // Growth Analysis
    if (analysis.growth.revenueGrowth > 0.2) {
      insights.push({
        type: 'opportunity',
        area: 'Growth',
        description: 'Strong revenue growth indicates market traction',
        impact: 'high',
        urgency: 'short_term',
        actionability: 'moderate',
        evidence: [`Revenue growth: ${(analysis.growth.revenueGrowth * 100).toFixed(1)}%`],
      });
    }

    // Efficiency Analysis
    if (analysis.efficiency.expenseRatio > 0.9) {
      insights.push({
        type: 'weakness',
        area: 'Efficiency',
        description: 'High expense ratio suggests operational inefficiencies',
        impact: 'medium',
        urgency: 'short_term',
        actionability: 'moderate',
        evidence: [`Expense ratio: ${(analysis.efficiency.expenseRatio * 100).toFixed(1)}%`],
      });
    }

    return insights;
  }

  private calculateTrend(snapshot: FinancialSnapshot): 'improving' | 'declining' | 'stable' {
    const netIncome = snapshot.monthlyIncome - snapshot.monthlyExpenses;
    const growth = snapshot.incomeGrowth - snapshot.expenseGrowth;
    
    if (growth > 0.05) return 'improving';
    if (growth < -0.05) return 'declining';
    return 'stable';
  }

  private calculateProfitGrowth(snapshot: FinancialSnapshot): number {
    const currentProfit = snapshot.monthlyIncome - snapshot.monthlyExpenses;
    const previousProfit = currentProfit / (1 + snapshot.incomeGrowth);
    return previousProfit > 0 ? (currentProfit - previousProfit) / previousProfit : 0;
  }

  private calculateDependencyScore(snapshot: FinancialSnapshot): number {
    // Analyze revenue concentration (mock calculation)
    const categoryConcentration = Math.max(...snapshot.categoryBreakdown.map(c => c.percentage)) / 100;
    return categoryConcentration;
  }

  private calculateVolatility(snapshot: FinancialSnapshot): number {
    // Calculate expense volatility (mock calculation)
    const expenseVariance = snapshot.categoryBreakdown.reduce((sum, cat) => {
      const mean = snapshot.monthlyExpenses / snapshot.categoryBreakdown.length;
      return sum + Math.pow(cat.amount - mean, 2);
    }, 0);
    return Math.sqrt(expenseVariance) / snapshot.monthlyExpenses;
  }
}

// ── Contextual Reasoning Engine ───────────────────────────────────────────────

class ContextualReasoningEngine {
  private analysisEngine: AdvancedAnalysisEngine;

  constructor() {
    this.analysisEngine = new AdvancedAnalysisEngine();
  }

  async reason(context: AIContext): Promise<ReasoningChain> {
    const startTime = Date.now();
    const mode = detectMode(context.currentPage, context.message);
    const systemContext = getModeSystemContext(context.currentPage, mode);

    const steps: ReasoningStep[] = [];
    const dataSources: string[] = [];

    // Step 1: Context Analysis
    const contextStep = this.analyzeContext(context, systemContext);
    steps.push(contextStep);

    // Step 2: Data Analysis (if financial data available)
    if (context.financialSnapshot) {
      const analysisStep = this.analyzeFinancialData(context.financialSnapshot);
      steps.push(analysisStep);
      dataSources.push('financial_snapshot');
    }

    // Step 3: Intent Analysis
    const intentStep = this.analyzeIntent(context.message, mode);
    steps.push(intentStep);

    // Step 4: Knowledge Integration
    const knowledgeStep = this.integrateKnowledge(context, steps);
    steps.push(knowledgeStep);
    dataSources.push('knowledge_base');

    // Step 5: Response Generation
    const responseStep = this.generateResponse(context, steps, mode);
    steps.push(responseStep);

    const processingTime = Date.now() - startTime;
    const conclusion = this.formulateConclusion(steps);

    return {
      id: `reasoning_${Date.now()}`,
      context,
      steps,
      conclusion,
      confidence: this.calculateConfidence(steps),
      processingTime,
      metadata: {
        mode,
        dataSources,
        assumptions: this.extractAssumptions(steps),
        limitations: this.identifyLimitations(steps),
      },
    };
  }

  private analyzeContext(context: AIContext, systemContext: string): ReasoningStep {
    return {
      id: 'context_analysis',
      type: 'analysis',
      description: 'Analyze user context and current page',
      input: { page: context.currentPage, role: context.role },
      output: { contextType: this.determineContextType(context.currentPage), systemContext },
      confidence: 0.9,
      reasoning: `User is on ${context.currentPage} with role ${context.role}. System context: ${systemContext}`,
      timestamp: new Date(),
    };
  }

  private analyzeFinancialData(snapshot: FinancialSnapshot): ReasoningStep {
    const analysis = this.analysisEngine.analyzeFinancialHealth(snapshot);
    
    return {
      id: 'financial_analysis',
      type: 'analysis',
      description: 'Analyze financial health and metrics',
      input: snapshot,
      output: analysis,
      confidence: 0.85,
      reasoning: `Calculated key financial metrics: net margin ${(analysis.profitability.netMargin * 100).toFixed(1)}%, cash runway ${analysis.liquidity.cashRunway.toFixed(1)} months`,
      timestamp: new Date(),
    };
  }

  private analyzeIntent(message: string, mode: string): ReasoningStep {
    const intent = this.extractIntent(message);
    
    return {
      id: 'intent_analysis',
      type: 'inference',
      description: 'Analyze user intent and requirements',
      input: { message, mode },
      output: { intent, entities: this.extractEntities(message) },
      confidence: 0.8,
      reasoning: `Detected intent: ${intent} in ${mode} mode`,
      timestamp: new Date(),
    };
  }

  private integrateKnowledge(context: AIContext, steps: ReasoningStep[]): ReasoningStep {
    const insights = this.generateInsights(steps);
    
    return {
      id: 'knowledge_integration',
      type: 'inference',
      description: 'Integrate domain knowledge and context',
      input: { steps, context },
      output: { insights, recommendations: this.generateRecommendations(insights) },
      confidence: 0.75,
      reasoning: `Integrated ${insights.length} insights from analysis steps`,
      timestamp: new Date(),
    };
  }

  private generateResponse(context: AIContext, steps: ReasoningStep[], mode: string): ReasoningStep {
    const responseStrategy = this.determineResponseStrategy(mode, steps);
    
    return {
      id: 'response_generation',
      type: 'recommendation',
      description: 'Generate appropriate response',
      input: { context, steps, mode },
      output: { strategy: responseStrategy, tone: this.determineTone(context, mode) },
      confidence: 0.8,
      reasoning: `Selected ${responseStrategy} strategy for ${mode} mode`,
      timestamp: new Date(),
    };
  }

  private formulateConclusion(steps: ReasoningStep[]): string {
    const analysisStep = steps.find(s => s.id === 'financial_analysis');
    const intentStep = steps.find(s => s.id === 'intent_analysis');
    
    let conclusion = 'Based on the analysis, ';
    
    if (analysisStep) {
      const analysis = analysisStep.output as FinancialAnalysis;
      conclusion += `the business shows ${analysis.profitability.netMargin > 0.1 ? 'healthy' : 'concerning'} profitability `;
    }
    
    if (intentStep) {
      conclusion += `and the user is looking to ${intentStep.output.intent}. `;
    }
    
    conclusion += 'Recommendations should focus on immediate actionable steps.';
    
    return conclusion;
  }

  private calculateConfidence(steps: ReasoningStep[]): number {
    const totalConfidence = steps.reduce((sum, step) => sum + step.confidence, 0);
    return totalConfidence / steps.length;
  }

  private extractAssumptions(steps: ReasoningStep[]): string[] {
    return steps
      .filter(step => step.type === 'inference')
      .map(step => `Assumption in ${step.description}`);
  }

  private identifyLimitations(steps: ReasoningStep[]): string[] {
    const limitations: string[] = [];
    
    if (!steps.find(s => s.id === 'financial_analysis')) {
      limitations.push('No financial data available for analysis');
    }
    
    if (steps.some(s => s.confidence < 0.7)) {
      limitations.push('Some analysis steps have low confidence');
    }
    
    return limitations;
  }

  // Helper methods
  private determineContextType(page: string): string {
    if (page.includes('/dashboard')) return 'overview';
    if (page.includes('/transactions')) return 'transaction_management';
    if (page.includes('/reports')) return 'reporting';
    if (page.includes('/invoices')) return 'billing';
    return 'general';
  }

  private extractIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('how') || lowerMessage.includes('what')) return 'information_seeking';
    if (lowerMessage.includes('create') || lowerMessage.includes('add')) return 'action_execution';
    if (lowerMessage.includes('analyze') || lowerMessage.includes('show')) return 'analysis_request';
    if (lowerMessage.includes('help') || lowerMessage.includes('guide')) return 'help_request';
    
    return 'general_inquiry';
  }

  private extractEntities(message: string): string[] {
    const entities: string[] = [];
    
    // Extract monetary amounts
    const amounts = message.match(/\$\d+(,\d{3})*(\.\d{2})?/g);
    if (amounts) entities.push(...amounts);
    
    // Extract dates
    const dates = message.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
    if (dates) entities.push(...dates);
    
    // Extract percentages
    const percentages = message.match(/\d+%/g);
    if (percentages) entities.push(...percentages);
    
    return entities;
  }

  private generateInsights(steps: ReasoningStep[]): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    const analysisStep = steps.find(s => s.id === 'financial_analysis');
    
    if (analysisStep) {
      const analysis = this.analysisEngine.generateBusinessInsights(
        analysisStep.output as FinancialAnalysis,
        steps[0].context
      );
      insights.push(...analysis);
    }
    
    return insights;
  }

  private generateRecommendations(insights: BusinessInsight[]): string[] {
    return insights
      .filter(insight => insight.actionability !== 'complex')
      .slice(0, 3)
      .map(insight => insight.description);
  }

  private determineResponseStrategy(mode: string, steps: ReasoningStep[]): string {
    const intentStep = steps.find(s => s.id === 'intent_analysis');
    const intent = intentStep?.output?.intent || 'general_inquiry';
    
    if (intent === 'action_execution') return 'action_oriented';
    if (intent === 'analysis_request') return 'analytical';
    if (intent === 'help_request') return 'educational';
    
    return 'conversational';
  }

  private determineTone(context: AIContext, mode: string): string {
    if (context.role === 'owner') return 'executive';
    if (context.role === 'accountant') return 'technical';
    return 'professional';
  }
}

// ── Export singleton instance ─────────────────────────────────────────────────

export const advancedReasoningEngine = new ContextualReasoningEngine();
export default advancedReasoningEngine;
