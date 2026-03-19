/**
 * Financial Insights Engine
 * ────────────────────────────────────────────────────────────────────────────
 * AI-powered financial analysis that provides actionable insights,
 * trend detection, anomaly identification, and business recommendations.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { FinancialSnapshot, AIAlert } from './types';

// ── Insight Types ─────────────────────────────────────────────────────────────

export interface FinancialInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'opportunity';
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  data: InsightData;
  recommendations: string[];
  generatedAt: Date;
  category: InsightCategory;
}

export type InsightType =
  | 'cash_flow_analysis'
  | 'expense_trend'
  | 'revenue_growth'
  | 'profitability'
  | 'efficiency'
  | 'risk_assessment'
  | 'opportunity'
  | 'anomaly_detection';

export type InsightCategory =
  | 'cash_management'
  | 'expense_control'
  | 'revenue_optimization'
  | 'profitability'
  | 'growth'
  | 'risk'
  | 'efficiency';

export interface InsightData {
  currentValue: number;
  previousValue?: number;
  percentageChange?: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  timeframe: string;
  comparison?: {
    industry: number;
    benchmark: number;
  };
  details: Record<string, any>;
}

export interface InsightReport {
  summary: {
    totalInsights: number;
    criticalIssues: number;
    opportunities: number;
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  insights: FinancialInsight[];
  trends: TrendAnalysis[];
  recommendations: PriorityRecommendation[];
  generatedAt: Date;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'upward' | 'downward' | 'stable' | 'cyclical';
  strength: number; // 0-1
  description: string;
  projection: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}

export interface PriorityRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  expectedImpact: string;
  timeframe: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

// ── Financial Analysis Engine ─────────────────────────────────────────────────

class FinancialAnalysisEngine {
  private historicalData: FinancialSnapshot[] = [];
  private industryBenchmarks = new Map<string, number>([
    ['profit_margin', 0.15],
    ['expense_ratio', 0.85],
    ['cash_ratio', 0.2],
    ['revenue_growth', 0.15],
    ['current_ratio', 1.5],
  ]);

  addHistoricalData(snapshot: FinancialSnapshot): void {
    this.historicalData.push(snapshot);
    
    // Keep only last 12 months of data
    if (this.historicalData.length > 12) {
      this.historicalData = this.historicalData.slice(-12);
    }
  }

  analyzeCashFlow(current: FinancialSnapshot): FinancialInsight | null {
    const cashBalance = current.totalBalance;
    const monthlyBurn = current.monthlyExpenses - current.monthlyIncome;
    const runway = monthlyBurn > 0 ? cashBalance / monthlyBurn : 12;

    let severity: 'info' | 'warning' | 'critical' = 'info';
    let impact: 'low' | 'medium' | 'high' = 'low';
    let recommendations: string[] = [];

    if (runway < 1) {
      severity = 'critical';
      impact = 'high';
      recommendations = [
        'Immediate cash conservation measures required',
        'Review and cut non-essential expenses',
        'Accelerate accounts receivable collection',
        'Consider short-term financing options',
      ];
    } else if (runway < 3) {
      severity = 'warning';
      impact = 'medium';
      recommendations = [
        'Monitor cash flow daily',
        'Delay non-critical purchases',
        'Focus on increasing sales or reducing costs',
      ];
    } else if (runway > 12) {
      recommendations = [
        'Consider investment opportunities',
        'Optimize cash allocation',
        'Explore growth initiatives',
      ];
    }

    return {
      id: `cash_flow_${Date.now()}`,
      type: 'cash_flow_analysis',
      title: `Cash Runway: ${runway.toFixed(1)} months`,
      description: `Based on current burn rate, you have ${runway.toFixed(1)} months of cash reserves.`,
      severity,
      impact,
      confidence: 0.9,
      data: {
        currentValue: cashBalance,
        previousValue: this.historicalData[this.historicalData.length - 2]?.totalBalance,
        percentageChange: this.calculatePercentageChange(
          cashBalance,
          this.historicalData[this.historicalData.length - 2]?.totalBalance
        ),
        trend: this.determineTrend('totalBalance'),
        timeframe: 'current',
        details: { runway, monthlyBurn },
      },
      recommendations,
      generatedAt: new Date(),
      category: 'cash_management',
    };
  }

  analyzeExpenseTrends(current: FinancialSnapshot): FinancialInsight | null {
    const currentExpenses = current.monthlyExpenses;
    const previousExpenses = this.historicalData[this.historicalData.length - 2]?.monthlyExpenses;
    
    if (!previousExpenses) return null;

    const percentageChange = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
    const trend = percentageChange > 5 ? 'increasing' : percentageChange < -5 ? 'decreasing' : 'stable';

    let severity: 'info' | 'warning' | 'critical' = 'info';
    let recommendations: string[] = [];

    if (percentageChange > 20) {
      severity = 'warning';
      recommendations = [
        'Investigate significant expense increase',
        'Review largest expense categories',
        'Implement expense control measures',
      ];
    } else if (percentageChange > 10) {
      recommendations = [
        'Monitor expense trends closely',
        'Budget for upcoming expenses',
      ];
    } else if (percentageChange < -10) {
      severity = 'opportunity' as any;
      recommendations = [
        'Maintain expense discipline',
        'Reallocate savings to growth initiatives',
      ];
    }

    return {
      id: `expense_trend_${Date.now()}`,
      type: 'expense_trend',
      title: `Expense Trend: ${trend} (${percentageChange.toFixed(1)}%)`,
      description: `Monthly expenses have ${trend} by ${Math.abs(percentageChange).toFixed(1)}% compared to last month.`,
      severity,
      impact: Math.abs(percentageChange) > 15 ? 'high' : Math.abs(percentageChange) > 5 ? 'medium' : 'low',
      confidence: 0.85,
      data: {
        currentValue: currentExpenses,
        previousValue: previousExpenses,
        percentageChange,
        trend: trend as any,
        timeframe: 'monthly',
        details: { categoryBreakdown: current.categoryBreakdown },
      },
      recommendations,
      generatedAt: new Date(),
      category: 'expense_control',
    };
  }

  analyzeRevenueGrowth(current: FinancialSnapshot): FinancialInsight | null {
    const currentRevenue = current.monthlyIncome;
    const previousRevenue = this.historicalData[this.historicalData.length - 2]?.monthlyIncome;
    
    if (!previousRevenue) return null;

    const growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    const industryBenchmark = this.industryBenchmarks.get('revenue_growth')! * 100;

    let severity: 'info' | 'warning' | 'critical' | 'opportunity' = 'info';
    let recommendations: string[] = [];

    if (growthRate < -10) {
      severity = 'critical';
      recommendations = [
        'Investigate revenue decline immediately',
        'Contact key customers for feedback',
        'Review pricing strategy',
        'Increase marketing and sales efforts',
      ];
    } else if (growthRate < 0) {
      severity = 'warning';
      recommendations = [
        'Monitor revenue trends',
        'Identify underperforming segments',
        'Consider promotional activities',
      ];
    } else if (growthRate > industryBenchmark) {
      severity = 'opportunity' as any;
      recommendations = [
        'Scale successful strategies',
        'Invest in growth initiatives',
        'Consider capacity expansion',
      ];
    }

    return {
      id: `revenue_growth_${Date.now()}`,
      type: 'revenue_growth',
      title: `Revenue Growth: ${growthRate.toFixed(1)}%`,
      description: `Monthly revenue has ${growthRate >= 0 ? 'grown' : 'declined'} by ${Math.abs(growthRate).toFixed(1)}% compared to last month.`,
      severity,
      impact: Math.abs(growthRate) > 15 ? 'high' : Math.abs(growthRate) > 5 ? 'medium' : 'low',
      confidence: 0.9,
      data: {
        currentValue: currentRevenue,
        previousValue: previousRevenue,
        percentageChange: growthRate,
        trend: growthRate > 5 ? 'increasing' : growthRate < -5 ? 'decreasing' : 'stable' as any,
        timeframe: 'monthly',
        comparison: {
          industry: industryBenchmark,
          benchmark: industryBenchmark,
        },
        details: { growthRate, industryBenchmark },
      },
      recommendations,
      generatedAt: new Date(),
      category: 'revenue_optimization',
    };
  }

  detectAnomalies(current: FinancialSnapshot): FinancialInsight | null {
    const anomalies: string[] = [];
    
    // Check for unusual expense spikes
    if (current.categoryBreakdown.length > 0) {
      const totalExpenses = current.categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
      const averageCategory = totalExpenses / current.categoryBreakdown.length;
      
      current.categoryBreakdown.forEach(category => {
        if (category.amount > averageCategory * 3) {
          anomalies.push(`${category.category}: $${category.amount.toLocaleString()} (unusually high)`);
        }
      });
    }

    // Check for transaction volume anomalies
    if (current.transactionCount > 0) {
      const avgTransactionValue = current.totalExpenses / current.transactionCount;
      if (avgTransactionValue > 1000) {
        anomalies.push(`High average transaction value: $${avgTransactionValue.toFixed(2)}`);
      }
    }

    if (anomalies.length === 0) return null;

    return {
      id: `anomaly_${Date.now()}`,
      type: 'anomaly_detection',
      title: 'Anomalies Detected',
      description: `Unusual patterns detected in financial data that may require attention.`,
      severity: 'warning',
      impact: anomalies.length > 2 ? 'high' : 'medium',
      confidence: 0.75,
      data: {
        currentValue: anomalies.length,
        trend: 'stable' as const,
        timeframe: 'current',
        details: { anomalies },
      },
      recommendations: [
        'Review identified anomalies for accuracy',
        'Investigate unusual transactions',
        'Consider adjusting monitoring thresholds',
      ],
      generatedAt: new Date(),
      category: 'risk',
    };
  }

  private calculatePercentageChange(current: number, previous?: number): number | undefined {
    if (!previous || previous === 0) return undefined;
    return ((current - previous) / previous) * 100;
  }

  private determineTrend(field: keyof FinancialSnapshot): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (this.historicalData.length < 3) return 'stable';
    
    const values = this.historicalData.slice(-3).map(d => d[field] as number);
    const changes = values.slice(1).map((val, i) => val - values[i]);
    
    const positiveChanges = changes.filter(c => c > 0).length;
    const negativeChanges = changes.filter(c => c < 0).length;
    
    if (positiveChanges === 2) return 'increasing';
    if (negativeChanges === 2) return 'decreasing';
    if (Math.abs(changes[0]) < 0.1 && Math.abs(changes[1]) < 0.1) return 'stable';
    return 'volatile';
  }
}

// ── Main Financial Insights Engine ─────────────────────────────────────────────

export class FinancialInsightsEngine {
  private analysisEngine: FinancialAnalysisEngine;
  private insightsCache = new Map<string, FinancialInsight[]>();

  constructor() {
    this.analysisEngine = new FinancialAnalysisEngine();
  }

  /**
   * Generate comprehensive financial insights
   */
  async generateInsights(currentData: FinancialSnapshot): Promise<InsightReport> {
    // Add current data to historical analysis
    this.analysisEngine.addHistoricalData(currentData);

    // Generate all insights
    const insights: FinancialInsight[] = [];

    // Core analyses
    const cashFlowInsight = this.analysisEngine.analyzeCashFlow(currentData);
    if (cashFlowInsight) insights.push(cashFlowInsight);

    const expenseInsight = this.analysisEngine.analyzeExpenseTrends(currentData);
    if (expenseInsight) insights.push(expenseInsight);

    const revenueInsight = this.analysisEngine.analyzeRevenueGrowth(currentData);
    if (revenueInsight) insights.push(revenueInsight);

    const anomalyInsight = this.analysisEngine.detectAnomalies(currentData);
    if (anomalyInsight) insights.push(anomalyInsight);

    // Generate trend analysis
    const trends = this.generateTrendAnalysis(currentData);

    // Generate priority recommendations
    const recommendations = this.generatePriorityRecommendations(insights);

    // Calculate overall health
    const overallHealth = this.calculateOverallHealth(insights);

    const report: InsightReport = {
      summary: {
        totalInsights: insights.length,
        criticalIssues: insights.filter(i => i.severity === 'critical').length,
        opportunities: insights.filter(i => i.severity === 'opportunity' as any).length,
        overallHealth,
      },
      insights,
      trends,
      recommendations,
      generatedAt: new Date(),
    };

    // Cache the insights
    this.insightsCache.set('latest', insights);

    return report;
  }

  private generateTrendAnalysis(currentData: FinancialSnapshot): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];

    // Revenue trend
    const revenueTrend = this.analysisEngine['determineTrend']('monthlyIncome');
    trends.push({
      metric: 'Revenue',
      trend: revenueTrend === 'increasing' ? 'upward' : revenueTrend === 'decreasing' ? 'downward' : 'stable',
      strength: 0.8,
      description: 'Monthly revenue trend based on recent data',
      projection: {
        nextMonth: currentData.monthlyIncome * 1.05,
        nextQuarter: currentData.monthlyIncome * 1.15,
        confidence: 0.7,
      },
    });

    // Expense trend
    const expenseTrend = this.analysisEngine['determineTrend']('monthlyExpenses');
    trends.push({
      metric: 'Expenses',
      trend: expenseTrend === 'increasing' ? 'upward' : expenseTrend === 'decreasing' ? 'downward' : 'stable',
      strength: 0.7,
      description: 'Monthly expense trend based on recent data',
      projection: {
        nextMonth: currentData.monthlyExpenses * 1.02,
        nextQuarter: currentData.monthlyExpenses * 1.06,
        confidence: 0.6,
      },
    });

    return trends;
  }

  private generatePriorityRecommendations(insights: FinancialInsight[]): PriorityRecommendation[] {
    const recommendations: PriorityRecommendation[] = [];

    insights.forEach(insight => {
      insight.recommendations.forEach(rec => {
        recommendations.push({
          priority: insight.severity === 'critical' ? 'high' : insight.impact === 'high' ? 'medium' : 'low',
          action: rec,
          expectedImpact: `Address ${insight.title.toLowerCase()}`,
          timeframe: insight.severity === 'critical' ? 'immediate' : insight.impact === 'high' ? '1-2 weeks' : '1 month',
          difficulty: 'moderate',
        });
      });
    });

    // Sort by priority and return top 5
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  }

  private calculateOverallHealth(insights: FinancialInsight[]): 'excellent' | 'good' | 'fair' | 'poor' {
    const criticalCount = insights.filter(i => i.severity === 'critical').length;
    const warningCount = insights.filter(i => i.severity === 'warning').length;
    const opportunityCount = insights.filter(i => i.severity === 'opportunity' as any).length;

    if (criticalCount > 0) return 'poor';
    if (warningCount > 2) return 'fair';
    if (opportunityCount > 2 && criticalCount === 0) return 'excellent';
    return 'good';
  }

  /**
   * Get cached insights
   */
  getCachedInsights(): FinancialInsight[] {
    return this.insightsCache.get('latest') || [];
  }

  /**
   * Clear insights cache
   */
  clearCache(): void {
    this.insightsCache.clear();
  }
}

// ── Export singleton instance ─────────────────────────────────────────────────

export const financialInsightsEngine = new FinancialInsightsEngine();
export default financialInsightsEngine;
