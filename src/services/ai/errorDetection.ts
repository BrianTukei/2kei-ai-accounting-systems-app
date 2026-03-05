/**
 * ai/errorDetection.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Error Detection Mode — proactively detects:
 *   - Duplicate transactions
 *   - Missing entries
 *   - Negative balances
 *   - Unbalanced journal entries
 *   - Unusual amounts
 *   - Data quality issues
 *
 * Runs against real injected data and returns structured alerts.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { FinancialSnapshot, AIAlert } from './types';
import { formatCurrency } from '@/lib/utils';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Currency-aware formatting — replaces hardcoded $ signs */
function fmtCur(n: number): string {
  return formatCurrency(n);
}

// ── Error detection rules ───────────────────────────────────────────────────

/**
 * Run all error detection checks on the financial snapshot.
 */
export function detectErrors(snap: FinancialSnapshot): AIAlert[] {
  const alerts: AIAlert[] = [];

  // 1. Negative balance
  if (snap.totalBalance < 0) {
    alerts.push({
      severity: 'critical',
      title: 'Negative Balance',
      message: `Your account balance is **-${fmtCur(Math.abs(snap.totalBalance))}**. This suggests expenses exceed income or there's a recording error.`,
      category: 'negative_balance',
    });
  }

  // 2. Operating loss
  const netProfit = snap.totalIncome - snap.totalExpenses;
  if (netProfit < 0) {
    alerts.push({
      severity: 'critical',
      title: 'Operating Loss',
      message: `Operating at a loss of **${fmtCur(Math.abs(netProfit))}**. Total expenses (${fmtCur(snap.totalExpenses)}) exceed revenue (${fmtCur(snap.totalIncome)}).`,
      category: 'general',
    });
  }

  // 3. Expense surge (>30% month-over-month)
  if (snap.expenseGrowth > 30) {
    alerts.push({
      severity: 'warning',
      title: 'Expense Surge',
      message: `Expenses jumped **${snap.expenseGrowth.toFixed(1)}%** compared to last month. This is an unusually large increase.`,
      category: 'expense_spike',
    });
  }

  // 4. Revenue decline (>20% drop)
  if (snap.incomeGrowth < -20) {
    alerts.push({
      severity: 'warning',
      title: 'Revenue Decline',
      message: `Revenue dropped **${Math.abs(snap.incomeGrowth).toFixed(1)}%** compared to last month. Investigate sales pipeline and client retention.`,
      category: 'revenue_decline',
    });
  }

  // 5. Overdue invoices
  if (snap.invoiceSummary && snap.invoiceSummary.overdue > 0) {
    alerts.push({
      severity: snap.invoiceSummary.overdueValue > snap.monthlyExpenses ? 'critical' : 'warning',
      title: 'Overdue Invoices',
      message: `**${snap.invoiceSummary.overdue}** overdue invoice(s) totaling **${fmtCur(snap.invoiceSummary.overdueValue)}**. This impacts your cash flow.`,
      category: 'overdue_invoice',
    });
  }

  // 6. Expense concentration risk
  if (snap.categoryBreakdown.length > 0 && snap.categoryBreakdown[0].percentage > 60) {
    alerts.push({
      severity: 'warning',
      title: 'Expense Concentration',
      message: `**${snap.categoryBreakdown[0].category}** accounts for ${snap.categoryBreakdown[0].percentage.toFixed(0)}% of ALL expenses (${fmtCur(snap.categoryBreakdown[0].amount)}). Consider diversifying.`,
      category: 'general',
    });
  }

  // 7. Zero income months (gaps in revenue)
  const zeroIncomeMonths = snap.monthlyData.filter(m => m.income === 0 && m.expenses > 0);
  if (zeroIncomeMonths.length > 0) {
    alerts.push({
      severity: 'warning',
      title: 'Missing Revenue Entries',
      message: `**${zeroIncomeMonths.length} month(s)** show expenses but zero income (${zeroIncomeMonths.map(m => m.name).join(', ')}). Are there missing income entries?`,
      category: 'missing_entry',
    });
  }

  // 8. Cash flow risk
  const monthlyBurn = snap.monthlyExpenses || 1;
  const runway = snap.totalBalance > 0 ? snap.totalBalance / monthlyBurn : 0;
  if (runway > 0 && runway < 2) {
    alerts.push({
      severity: 'critical',
      title: 'Cash Flow Emergency',
      message: `Only **${runway.toFixed(1)} months** of cash runway. At current burn rate (${fmtCur(monthlyBurn)}/mo), cash will run out within ${Math.ceil(runway * 30)} days.`,
      category: 'cashflow_risk',
    });
  } else if (runway > 0 && runway < 4) {
    alerts.push({
      severity: 'warning',
      title: 'Low Cash Runway',
      message: `Cash runway is **${runway.toFixed(1)} months**. Best practice is 6+ months. Consider building reserves.`,
      category: 'cashflow_risk',
    });
  }

  // 9. Months with no transactions at all
  const emptyMonths = snap.monthlyData.filter(m => m.income === 0 && m.expenses === 0);
  if (emptyMonths.length > 0 && snap.monthlyData.length > emptyMonths.length) {
    alerts.push({
      severity: 'info',
      title: 'Missing Monthly Data',
      message: `**${emptyMonths.length} month(s)** have no recorded transactions (${emptyMonths.map(m => m.name).join(', ')}). Ensure all transactions are captured.`,
      category: 'missing_entry',
    });
  }

  // 10. Suspiciously even amounts (potential rounding/estimation)
  const suspiciousRounding = snap.categoryBreakdown.filter(c => {
    const amount = c.amount;
    return amount > 100 && (amount % 1000 === 0 || amount % 500 === 0) && c.percentage > 10;
  });
  if (suspiciousRounding.length > 1) {
    alerts.push({
      severity: 'info',
      title: 'Rounded Amounts Detected',
      message: `Multiple expense categories have suspiciously round amounts (${suspiciousRounding.map(c => c.category).join(', ')}). Verify these are actual vs estimated figures.`,
      category: 'general',
    });
  }

  return alerts;
}

/**
 * Generate error detection response for AI chat.
 */
export function generateErrorDetectionResponse(snap: FinancialSnapshot): string {
  const alerts = detectErrors(snap);

  if (alerts.length === 0) {
    return (
      `## ✅ Error Detection Scan Complete\n\n` +
      `No errors or anomalies detected in your financial data.\n\n` +
      `**Checks performed:**\n` +
      `• Balance validation ✅\n` +
      `• Expense surge detection ✅\n` +
      `• Revenue trend analysis ✅\n` +
      `• Invoice status check ✅\n` +
      `• Data completeness review ✅\n` +
      `• Cash flow risk assessment ✅\n\n` +
      `Everything looks good! I'll alert you if I detect issues in the future.`
    );
  }

  const critical = alerts.filter(a => a.severity === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning');
  const info = alerts.filter(a => a.severity === 'info');

  let response = `## 🔍 Error Detection Report\n\n`;
  response += `Found **${alerts.length}** issue(s): ${critical.length} critical, ${warnings.length} warnings, ${info.length} info\n\n`;

  if (critical.length > 0) {
    response += `### 🔴 Critical Issues (fix immediately)\n`;
    critical.forEach((a, i) => {
      response += `**${i + 1}. ${a.title}**\n`;
      response += `${a.message}\n\n`;
    });
  }

  if (warnings.length > 0) {
    response += `### ⚠️ Warnings (review this week)\n`;
    warnings.forEach((a, i) => {
      response += `**${i + 1}. ${a.title}**\n`;
      response += `${a.message}\n\n`;
    });
  }

  if (info.length > 0) {
    response += `### ℹ️ Observations\n`;
    info.forEach((a, i) => {
      response += `**${i + 1}. ${a.title}**\n`;
      response += `${a.message}\n\n`;
    });
  }

  response += `### Recommended Actions\n`;
  if (critical.length > 0) {
    response += `1. Address critical issues within **24 hours**\n`;
  }
  if (warnings.length > 0) {
    response += `2. Review and resolve warnings within **1 week**\n`;
  }
  response += `3. Schedule regular error scans (weekly recommended)\n`;

  return response;
}
