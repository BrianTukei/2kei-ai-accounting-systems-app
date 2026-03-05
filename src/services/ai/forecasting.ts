/**
 * ai/forecasting.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Financial Forecasting Engine — predictive analysis using historical data.
 *
 * Capabilities:
 *   - 3-month revenue forecast
 *   - Expense projection
 *   - Cash runway estimation
 *   - Break-even analysis
 *
 * Uses linear regression + weighted moving average on monthly data.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { FinancialSnapshot, ForecastResult } from './types';
import { formatCurrency } from '@/lib/utils';

// ── Formatting ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Currency-aware formatting — replaces hardcoded $ signs */
function fmtCur(n: number): string {
  return formatCurrency(n);
}

// ── Statistical helpers ─────────────────────────────────────────────────────

/**
 * Simple linear regression: y = mx + b
 * Returns slope (m) and intercept (b).
 */
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
    sumY2 += values[i] * values[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² for confidence
  const meanY = sumY / n;
  const ssTotal = values.reduce((s, v) => s + Math.pow(v - meanY, 2), 0);
  const ssResidual = values.reduce((s, v, i) => s + Math.pow(v - (slope * i + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  return { slope, intercept, r2 };
}

/**
 * Weighted moving average — recent months weighted more heavily.
 */
function weightedMovingAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const weights = values.map((_, i) => i + 1); // 1, 2, 3, ...
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  return values.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight;
}

// ── Forecasting ─────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Generate 3-month financial forecast from historical data.
 */
export function generateForecast(snap: FinancialSnapshot): ForecastResult {
  const incomes = snap.monthlyData.map(m => m.income);
  const expenses = snap.monthlyData.map(m => m.expenses);

  // Linear regression
  const incomeReg = linearRegression(incomes);
  const expenseReg = linearRegression(expenses);

  // WMA for additional perspective
  const incomeWMA = weightedMovingAverage(incomes);
  const expenseWMA = weightedMovingAverage(expenses);

  // Blend: 60% regression + 40% WMA for more stable forecasts
  const n = snap.monthlyData.length;
  const currentMonth = new Date().getMonth();

  const revenueProjection: ForecastResult['revenueProjection'] = [];
  const expenseProjection: ForecastResult['expenseProjection'] = [];

  for (let i = 1; i <= 3; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const monthName = MONTH_NAMES[monthIndex];

    const regRevenue = Math.max(0, incomeReg.slope * (n + i - 1) + incomeReg.intercept);
    const blendedRevenue = regRevenue * 0.6 + incomeWMA * 0.4;
    const revenueConfidence = Math.max(0.3, Math.min(0.95, incomeReg.r2 * (1 - i * 0.1)));

    const regExpense = Math.max(0, expenseReg.slope * (n + i - 1) + expenseReg.intercept);
    const blendedExpense = regExpense * 0.6 + expenseWMA * 0.4;
    const expenseConfidence = Math.max(0.3, Math.min(0.95, expenseReg.r2 * (1 - i * 0.1)));

    revenueProjection.push({
      month: monthName,
      projected: Math.round(blendedRevenue * 100) / 100,
      confidence: Math.round(revenueConfidence * 100) / 100,
    });

    expenseProjection.push({
      month: monthName,
      projected: Math.round(blendedExpense * 100) / 100,
      confidence: Math.round(expenseConfidence * 100) / 100,
    });
  }

  // Cash runway
  const monthlyBurn = snap.monthlyExpenses > 0 ? snap.monthlyExpenses : expenseWMA;
  const monthlyNet = snap.monthlyIncome - snap.monthlyExpenses;
  const burnRate = Math.max(monthlyBurn, 1);
  const cashRunway = snap.totalBalance > 0
    ? monthlyNet >= 0
      ? 999 // Positive cash flow = indefinite runway
      : snap.totalBalance / Math.abs(monthlyNet)
    : 0;

  // Break-even
  let breakEvenDate: string | undefined;
  if (snap.totalBalance < 0 && monthlyNet > 0) {
    const monthsToBreakEven = Math.abs(snap.totalBalance) / monthlyNet;
    const breakEven = new Date();
    breakEven.setMonth(breakEven.getMonth() + Math.ceil(monthsToBreakEven));
    breakEvenDate = breakEven.toISOString().slice(0, 10);
  }

  // Summary
  const avgProjectedRevenue = revenueProjection.reduce((s, r) => s + r.projected, 0) / 3;
  const avgProjectedExpense = expenseProjection.reduce((s, e) => s + e.projected, 0) / 3;
  const projectedProfit = avgProjectedRevenue - avgProjectedExpense;

  let summary = '';
  if (cashRunway >= 999) {
    summary = 'Your cash flow is positive. At current rates, your cash reserves will continue growing.';
  } else if (cashRunway >= 6) {
    summary = `At your current burn rate, your cash will last approximately **${cashRunway.toFixed(1)} months**.`;
  } else if (cashRunway >= 3) {
    summary = `⚠️ Cash runway is **${cashRunway.toFixed(1)} months**. Consider building reserves.`;
  } else if (cashRunway > 0) {
    summary = `🔴 Critical: Cash will run out in approximately **${cashRunway.toFixed(1)} months**. Immediate action needed.`;
  } else {
    summary = `🔴 Cash reserves are depleted. Urgent funding or cost reduction required.`;
  }

  if (projectedProfit > 0) {
    summary += `\n\nProjected average monthly profit: **${fmtCur(projectedProfit)}** over next 3 months.`;
  } else if (projectedProfit < 0) {
    summary += `\n\nProjected average monthly loss: **${fmtCur(Math.abs(projectedProfit))}** over next 3 months.`;
  }

  return {
    revenueProjection,
    expenseProjection,
    cashRunway: Math.min(cashRunway, 999),
    burnRate,
    breakEvenDate,
    summary,
  };
}

/**
 * Generate forecasting response for the AI chat.
 */
export function generateForecastResponse(snap: FinancialSnapshot): string {
  if (snap.monthlyData.length < 2) {
    return 'I need at least 2 months of data to generate forecasts. Keep recording transactions and check back soon!';
  }

  const forecast = generateForecast(snap);

  let response = `## 📈 3-Month Financial Forecast\n\n`;

  // Revenue projection table
  response += `### Revenue Projection\n`;
  response += `| Month | Projected | Confidence |\n`;
  response += `|-------|----------:|-----------:|\n`;
  for (const r of forecast.revenueProjection) {
    const confBar = '█'.repeat(Math.round(r.confidence * 5)) + '░'.repeat(5 - Math.round(r.confidence * 5));
    response += `| ${r.month} | ${fmtCur(r.projected)} | ${(r.confidence * 100).toFixed(0)}% ${confBar} |\n`;
  }
  response += '\n';

  // Expense projection table
  response += `### Expense Projection\n`;
  response += `| Month | Projected | Confidence |\n`;
  response += `|-------|----------:|-----------:|\n`;
  for (const e of forecast.expenseProjection) {
    const confBar = '█'.repeat(Math.round(e.confidence * 5)) + '░'.repeat(5 - Math.round(e.confidence * 5));
    response += `| ${e.month} | ${fmtCur(e.projected)} | ${(e.confidence * 100).toFixed(0)}% ${confBar} |\n`;
  }
  response += '\n';

  // Key metrics
  response += `### Key Metrics\n`;
  response += `• **Cash Runway:** ${forecast.cashRunway >= 999 ? '∞ (positive cash flow)' : `${forecast.cashRunway.toFixed(1)} months`}\n`;
  response += `• **Monthly Burn Rate:** ${fmtCur(forecast.burnRate)}\n`;
  if (forecast.breakEvenDate) {
    response += `• **Projected Break-Even:** ${forecast.breakEvenDate}\n`;
  }
  response += '\n';

  // Summary
  response += `### Summary\n`;
  response += forecast.summary;
  response += `\n\n*Forecast based on ${snap.monthlyData.length} months of historical data. Confidence decreases for distant projections.*`;

  return response;
}
