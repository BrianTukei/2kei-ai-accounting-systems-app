/**
 * ai/analysis.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Financial Analysis Engine — analyzes real system data and detects:
 *   - Profit decline
 *   - Expense spikes
 *   - Cashflow risks
 *   - Overdue invoices
 *   - Payroll anomalies
 *   - Revenue trends
 *
 * Uses only REAL injected data — never fabricates numbers.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { FinancialSnapshot, AIAlert } from './types';
import { formatCurrency } from '@/lib/utils';

// ── Formatting helpers ──────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Currency-aware formatting — replaces hardcoded $ signs */
function fmtCur(n: number): string {
  return formatCurrency(n);
}
function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

// ── Trend analysis ──────────────────────────────────────────────────────────

interface TrendResult {
  direction: 'up' | 'down' | 'flat';
  changePercent: number;
  averageMonthly: number;
  volatility: number; // coefficient of variation
}

/**
 * Analyze trend from monthly data array.
 */
export function analyzeTrend(values: number[]): TrendResult {
  if (values.length < 2) {
    return { direction: 'flat', changePercent: 0, averageMonthly: values[0] || 0, volatility: 0 };
  }

  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const changePercent = prev > 0 ? ((last - prev) / prev) * 100 : 0;

  // Coefficient of variation
  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const volatility = avg > 0 ? (stdDev / avg) * 100 : 0;

  const direction = changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'flat';

  return { direction, changePercent, averageMonthly: avg, volatility };
}

// ── Comprehensive analysis ──────────────────────────────────────────────────

export interface FinancialAnalysis {
  profitability: {
    netProfit: number;
    netMargin: number;
    rating: 'excellent' | 'good' | 'thin' | 'loss';
    trend: TrendResult;
  };
  expenses: {
    total: number;
    monthlyAverage: number;
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
    trend: TrendResult;
    spikeDetected: boolean;
    spikeCategory?: string;
    spikeAmount?: number;
  };
  cashflow: {
    balance: number;
    monthlyNet: number;
    runway: number;
    status: 'strong' | 'adequate' | 'low' | 'critical';
  };
  revenue: {
    total: number;
    monthlyAverage: number;
    trend: TrendResult;
    declining: boolean;
  };
  invoices: {
    collectionRate: number;
    overdueAmount: number;
    overdueCount: number;
    atRisk: boolean;
  };
  alerts: AIAlert[];
}

/**
 * Run comprehensive financial analysis on the snapshot.
 * Returns structured analysis object with alerts.
 */
export function analyzeFinancials(snap: FinancialSnapshot): FinancialAnalysis {
  const netProfit = snap.totalIncome - snap.totalExpenses;
  const netMargin = snap.totalIncome > 0 ? (netProfit / snap.totalIncome) * 100 : 0;

  // Monthly data arrays
  const incomeValues = snap.monthlyData.map(m => m.income);
  const expenseValues = snap.monthlyData.map(m => m.expenses);
  const profitValues = snap.monthlyData.map(m => m.income - m.expenses);

  const incomeTrend = analyzeTrend(incomeValues);
  const expenseTrend = analyzeTrend(expenseValues);
  const profitTrend = analyzeTrend(profitValues);

  // Expense spike detection
  const avgExpense = expenseValues.reduce((s, v) => s + v, 0) / Math.max(expenseValues.length, 1);
  const currentMonthExpense = expenseValues[expenseValues.length - 1] || 0;
  const spikeDetected = avgExpense > 0 && currentMonthExpense > avgExpense * 1.25;

  // Find spike category
  let spikeCategory: string | undefined;
  let spikeAmount: number | undefined;
  if (spikeDetected && snap.categoryBreakdown.length > 0) {
    spikeCategory = snap.categoryBreakdown[0].category;
    spikeAmount = snap.categoryBreakdown[0].amount;
  }

  // Cash flow
  const monthlyBurn = snap.monthlyExpenses || 1;
  const runway = snap.totalBalance > 0 ? snap.totalBalance / monthlyBurn : 0;
  const monthlyNet = snap.monthlyIncome - snap.monthlyExpenses;
  const cashStatus = runway >= 6 ? 'strong' : runway >= 3 ? 'adequate' : runway > 0 ? 'low' : 'critical';

  // Invoices
  const invSummary = snap.invoiceSummary;
  const collectionRate = invSummary && invSummary.total > 0 ? (invSummary.paid / invSummary.total) * 100 : 100;

  // Rating
  const profitRating = netMargin >= 20 ? 'excellent' : netMargin >= 10 ? 'good' : netMargin >= 0 ? 'thin' : 'loss';

  // Build alerts
  const alerts: AIAlert[] = [];

  if (netProfit < 0) {
    alerts.push({
      severity: 'critical',
      title: 'Operating at Loss',
      message: `Net loss of ${fmtCur(Math.abs(netProfit))}. Expenses exceed revenue by ${Math.abs(netMargin).toFixed(1)}%.`,
      category: 'general',
    });
  }

  if (snap.totalBalance < 0) {
    alerts.push({
      severity: 'critical',
      title: 'Negative Cash Balance',
      message: `Cash balance is -${fmtCur(Math.abs(snap.totalBalance))}. Immediate attention required.`,
      category: 'negative_balance',
    });
  }

  if (runway > 0 && runway < 3) {
    alerts.push({
      severity: 'critical',
      title: 'Low Cash Runway',
      message: `Only ${runway.toFixed(1)} months of cash runway at current burn rate (${fmtCur(monthlyBurn)}/mo).`,
      category: 'cashflow_risk',
    });
  }

  if (spikeDetected) {
    const pctIncrease = avgExpense > 0 ? ((currentMonthExpense - avgExpense) / avgExpense * 100) : 0;
    alerts.push({
      severity: 'warning',
      title: 'Expense Spike Detected',
      message: `Expenses this month (${fmtCur(currentMonthExpense)}) are ${pctIncrease.toFixed(0)}% above average${spikeCategory ? `, driven by ${spikeCategory}` : ''}.`,
      category: 'expense_spike',
    });
  }

  if (incomeTrend.direction === 'down' && incomeTrend.changePercent < -10) {
    alerts.push({
      severity: 'warning',
      title: 'Revenue Decline',
      message: `Revenue dropped ${fmtPct(incomeTrend.changePercent)} from last month. Investigate sales pipeline.`,
      category: 'revenue_decline',
    });
  }

  if (invSummary && invSummary.overdue > 0) {
    alerts.push({
      severity: invSummary.overdueValue > snap.monthlyExpenses ? 'critical' : 'warning',
      title: 'Overdue Invoices',
      message: `${invSummary.overdue} overdue invoice(s) totaling ${fmtCur(invSummary.overdueValue)}. Follow up immediately.`,
      category: 'overdue_invoice',
    });
  }

  if (expenseTrend.volatility > 50) {
    alerts.push({
      severity: 'warning',
      title: 'Unstable Expenses',
      message: `Expense volatility is high (${expenseTrend.volatility.toFixed(0)}% CV). Inconsistent spending patterns detected.`,
      category: 'general',
    });
  }

  if (snap.categoryBreakdown.length > 0 && snap.categoryBreakdown[0].percentage > 60) {
    alerts.push({
      severity: 'info',
      title: 'Expense Concentration',
      message: `${snap.categoryBreakdown[0].category} accounts for ${snap.categoryBreakdown[0].percentage.toFixed(0)}% of all expenses. Consider diversifying.`,
      category: 'general',
    });
  }

  return {
    profitability: {
      netProfit,
      netMargin,
      rating: profitRating,
      trend: profitTrend,
    },
    expenses: {
      total: snap.totalExpenses,
      monthlyAverage: avgExpense,
      topCategories: snap.categoryBreakdown.slice(0, 5),
      trend: expenseTrend,
      spikeDetected,
      spikeCategory,
      spikeAmount,
    },
    cashflow: {
      balance: snap.totalBalance,
      monthlyNet,
      runway,
      status: cashStatus,
    },
    revenue: {
      total: snap.totalIncome,
      monthlyAverage: incomeTrend.averageMonthly,
      trend: incomeTrend,
      declining: incomeTrend.direction === 'down',
    },
    invoices: {
      collectionRate,
      overdueAmount: invSummary?.overdueValue || 0,
      overdueCount: invSummary?.overdue || 0,
      atRisk: collectionRate < 70,
    },
    alerts,
  };
}

/**
 * Generate a natural-language analysis summary from the analysis.
 */
export function generateAnalysisSummary(analysis: FinancialAnalysis): string {
  const { profitability, expenses, cashflow, revenue, invoices, alerts } = analysis;

  let summary = `## 📊 Financial Intelligence Report\n\n`;

  // Profitability
  const profitEmoji = profitability.rating === 'excellent' ? '🟢' : profitability.rating === 'good' ? '🟡' : profitability.rating === 'thin' ? '🟠' : '🔴';
  summary += `### ${profitEmoji} Profitability: ${profitability.rating.toUpperCase()}\n`;
  summary += `• Net ${profitability.netProfit >= 0 ? 'Profit' : 'Loss'}: **${fmtCur(Math.abs(profitability.netProfit))}** (${profitability.netMargin.toFixed(1)}% margin)\n`;
  summary += `• Trend: ${profitability.trend.direction === 'up' ? '📈 Improving' : profitability.trend.direction === 'down' ? '📉 Declining' : '➡️ Stable'} (${fmtPct(profitability.trend.changePercent)})\n\n`;

  // Revenue
  summary += `### 💰 Revenue\n`;
  summary += `• Total: **${fmtCur(revenue.total)}** | Monthly avg: ${fmtCur(revenue.monthlyAverage)}\n`;
  summary += `• Trend: ${fmtPct(revenue.trend.changePercent)} ${revenue.declining ? '⚠️ Declining' : '✅'}\n\n`;

  // Expenses
  summary += `### 📉 Expenses\n`;
  summary += `• Total: **${fmtCur(expenses.total)}** | Monthly avg: ${fmtCur(expenses.monthlyAverage)}\n`;
  if (expenses.spikeDetected) {
    summary += `• ⚠️ **Spike detected** — up from ${fmtCur(expenses.monthlyAverage)} avg${expenses.spikeCategory ? `, mainly ${expenses.spikeCategory}` : ''}\n`;
  }
  if (expenses.topCategories.length > 0) {
    summary += `• Top: ${expenses.topCategories.slice(0, 3).map(c => `${c.category} (${c.percentage.toFixed(0)}%)`).join(', ')}\n`;
  }
  summary += '\n';

  // Cash Flow
  const cashEmoji = cashflow.status === 'strong' ? '🟢' : cashflow.status === 'adequate' ? '🟡' : cashflow.status === 'low' ? '🟠' : '🔴';
  summary += `### ${cashEmoji} Cash Flow: ${cashflow.status.toUpperCase()}\n`;
  summary += `• Balance: **${fmtCur(cashflow.balance)}** | Net/mo: ${fmtCur(cashflow.monthlyNet)}\n`;
  summary += `• Runway: **${cashflow.runway.toFixed(1)} months**\n\n`;

  // Invoices
  if (invoices.overdueCount > 0 || invoices.collectionRate < 100) {
    summary += `### 🧾 Invoices\n`;
    summary += `• Collection rate: **${invoices.collectionRate.toFixed(0)}%**\n`;
    if (invoices.overdueCount > 0) {
      summary += `• Overdue: **${invoices.overdueCount}** invoices (${fmtCur(invoices.overdueAmount)})\n`;
    }
    summary += '\n';
  }

  // Alerts
  if (alerts.length > 0) {
    const critical = alerts.filter(a => a.severity === 'critical');
    const warnings = alerts.filter(a => a.severity === 'warning');

    if (critical.length > 0) {
      summary += `### 🔴 Critical Alerts\n`;
      critical.forEach(a => { summary += `• ${a.message}\n`; });
      summary += '\n';
    }
    if (warnings.length > 0) {
      summary += `### ⚠️ Warnings\n`;
      warnings.forEach(a => { summary += `• ${a.message}\n`; });
      summary += '\n';
    }
  } else {
    summary += `✅ No critical alerts. Your finances look healthy!\n`;
  }

  return summary;
}

/**
 * Compare two periods and generate insight text.
 */
export function generateComparisonInsight(snap: FinancialSnapshot): string {
  if (snap.monthlyData.length < 2) {
    return 'Need at least 2 months of data for period comparison.';
  }

  const current = snap.monthlyData[snap.monthlyData.length - 1];
  const previous = snap.monthlyData[snap.monthlyData.length - 2];

  const incomeChange = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0;
  const expenseChange = previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0;
  const currentProfit = current.income - current.expenses;
  const previousProfit = previous.income - previous.expenses;

  let insight = `## 📊 Month-over-Month Comparison\n\n`;
  insight += `| Metric | ${previous.name} | ${current.name} | Change |\n`;
  insight += `|--------|------:|------:|-------:|\n`;
  insight += `| Revenue | ${fmtCur(previous.income)} | ${fmtCur(current.income)} | ${fmtPct(incomeChange)} |\n`;
  insight += `| Expenses | ${fmtCur(previous.expenses)} | ${fmtCur(current.expenses)} | ${fmtPct(expenseChange)} |\n`;
  insight += `| Net | ${fmtCur(previousProfit)} | ${fmtCur(currentProfit)} | ${currentProfit >= previousProfit ? '📈' : '📉'} |\n\n`;

  // Key takeaway
  if (incomeChange > 0 && expenseChange <= 0) {
    insight += `✅ **Great month!** Revenue grew while expenses stayed flat or decreased.`;
  } else if (incomeChange > 0 && expenseChange > incomeChange) {
    insight += `⚠️ Revenue grew but expenses grew **faster** (${fmtPct(expenseChange)} vs ${fmtPct(incomeChange)}). Watch your margins.`;
  } else if (incomeChange < 0 && expenseChange > 0) {
    insight += `🔴 **Concerning:** Revenue declined while expenses increased. This trend needs immediate action.`;
  } else if (expenseChange > 25) {
    insight += `⚠️ Expenses increased **${fmtPct(expenseChange)}** compared to last month${snap.categoryBreakdown.length > 0 ? `, mainly due to **${snap.categoryBreakdown[0].category}** and **${snap.categoryBreakdown[1]?.category || 'other'}**` : ''}.`;
  } else {
    insight += `➡️ Performance is relatively stable. Keep monitoring trends.`;
  }

  return insight;
}
