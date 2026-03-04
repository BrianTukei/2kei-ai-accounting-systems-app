/**
 * ai/businessCoach.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Business Coach Mode — provides:
 *   - Cost reduction advice
 *   - Growth suggestions
 *   - Profit improvement strategies
 *   - Financial optimization insights
 *
 * All advice is grounded in the user's real financial data.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { FinancialSnapshot } from './types';
import { analyzeFinancials, type FinancialAnalysis } from './analysis';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Coaching topics ─────────────────────────────────────────────────────────

type CoachingTopic =
  | 'cost_reduction'
  | 'growth'
  | 'profit_improvement'
  | 'optimization'
  | 'general';

function detectCoachingTopic(message: string): CoachingTopic {
  const lower = message.toLowerCase();
  if (/cost.*(?:cut|reduc|lower|save|trim)/i.test(lower) || /reduc.*(?:cost|expense|spend)/i.test(lower) || /save\s*money/i.test(lower)) {
    return 'cost_reduction';
  }
  if (/grow|scale|expand|increase\s*(?:revenue|sales|income)/i.test(lower)) {
    return 'growth';
  }
  if (/profit|margin|improv.*(?:profit|margin)/i.test(lower) || /more\s*money/i.test(lower)) {
    return 'profit_improvement';
  }
  if (/optimi[sz]|efficien|streamline|automat/i.test(lower)) {
    return 'optimization';
  }
  return 'general';
}

// ── Coach response generators ───────────────────────────────────────────────

function generateCostReductionAdvice(analysis: FinancialAnalysis, snap: FinancialSnapshot): string {
  const { expenses, cashflow } = analysis;
  let response = `## 💡 Cost Reduction Strategy\n\n`;
  response += `**Current Expense Profile:**\n`;
  response += `• Total Expenses: $${fmt(expenses.total)}\n`;
  response += `• Monthly Average: $${fmt(expenses.monthlyAverage)}\n`;
  response += `• Expense Trend: ${expenses.trend.direction === 'up' ? '📈 Rising' : expenses.trend.direction === 'down' ? '📉 Falling' : '➡️ Stable'}\n\n`;

  response += `### 🎯 Actionable Cost-Cutting Strategies\n\n`;

  // Strategy 1: Top category
  if (expenses.topCategories.length > 0) {
    const top = expenses.topCategories[0];
    const savings10pct = top.amount * 0.1;
    response += `**1. Audit ${top.category} (${top.percentage.toFixed(0)}% of expenses)**\n`;
    response += `This is your largest cost center at $${fmt(top.amount)}. A 10% reduction saves **$${fmt(savings10pct)}**.\n`;
    response += `→ Review contracts, negotiate rates, find alternatives.\n\n`;
  }

  // Strategy 2: Second category
  if (expenses.topCategories.length > 1) {
    const second = expenses.topCategories[1];
    response += `**2. Optimize ${second.category} Spend**\n`;
    response += `At $${fmt(second.amount)} (${second.percentage.toFixed(0)}%), there may be room to consolidate or eliminate redundancies.\n\n`;
  }

  // Strategy 3: Spike-based
  if (expenses.spikeDetected) {
    response += `**3. Address Expense Spike**\n`;
    response += `⚠️ This month's expenses spiked above average${expenses.spikeCategory ? ` in ${expenses.spikeCategory}` : ''}. Was this a one-time cost or recurring? Investigate and set budget caps.\n\n`;
  } else {
    response += `**3. Implement Budget Caps**\n`;
    response += `Set monthly limits per category to prevent overspending. Start with your top 3 categories.\n\n`;
  }

  // Strategy 4: Cash flow impact
  response += `**4. Improve Cash Flow Timing**\n`;
  response += `• Invoice immediately after service delivery\n`;
  response += `• Negotiate 45–60 day payment terms with suppliers\n`;
  response += `• Monthly cash runway: **${cashflow.runway.toFixed(1)} months** — aim for 6+\n\n`;

  // Potential savings
  const potential5pct = expenses.total * 0.05;
  const potential10pct = expenses.total * 0.10;
  response += `### 💰 Savings Potential\n`;
  response += `• Conservative (5% cut): **$${fmt(potential5pct)}** saved\n`;
  response += `• Moderate (10% cut): **$${fmt(potential10pct)}** saved\n`;
  response += `• **Impact on margin:** +${((potential10pct / Math.max(snap.totalIncome, 1)) * 100).toFixed(1)}% net margin improvement\n`;

  return response;
}

function generateGrowthAdvice(analysis: FinancialAnalysis, snap: FinancialSnapshot): string {
  const { revenue, profitability, cashflow } = analysis;
  let response = `## 🚀 Growth Strategy\n\n`;

  response += `**Current Position:**\n`;
  response += `• Revenue: $${fmt(revenue.total)} | Growth: ${revenue.trend.changePercent >= 0 ? '+' : ''}${revenue.trend.changePercent.toFixed(1)}%/mo\n`;
  response += `• Net Margin: ${profitability.netMargin.toFixed(1)}%\n`;
  response += `• Cash Reserves: $${fmt(cashflow.balance)}\n\n`;

  // Readiness assessment
  const readiness = profitability.netMargin >= 15 ? 'ready' : profitability.netMargin >= 5 ? 'nearly_ready' : 'not_ready';
  response += `### Growth Readiness: ${readiness === 'ready' ? '🟢 READY' : readiness === 'nearly_ready' ? '🟡 NEARLY READY' : '🔴 FIX FOUNDATION FIRST'}\n\n`;

  if (readiness === 'not_ready') {
    response += `Before scaling, improve your fundamentals:\n`;
    response += `1. Increase margins to 15%+ (currently ${profitability.netMargin.toFixed(1)}%)\n`;
    response += `2. Build cash reserves to 3+ months (currently ${cashflow.runway.toFixed(1)})\n`;
    response += `3. Stabilize expenses (trend: ${analysis.expenses.trend.direction})\n\n`;
  }

  response += `### Growth Strategies\n\n`;

  // Strategy 1: Revenue
  if (revenue.declining) {
    response += `**1. 🔴 Stop the Revenue Decline**\n`;
    response += `Revenue is trending down. Before growth, stabilize:\n`;
    response += `• Survey existing clients — why are they leaving?\n`;
    response += `• Add value to retain current revenue base\n`;
    response += `• Offer loyalty discounts or bundles\n\n`;
  } else {
    response += `**1. Upsell Existing Clients**\n`;
    response += `Your cheapest growth comes from clients who already trust you.\n`;
    response += `• Create premium tiers or add-on services\n`;
    response += `• Raise prices by 5–10% (test on new clients first)\n`;
    response += `• Cross-sell complementary products\n\n`;
  }

  // Strategy 2: Efficiency
  response += `**2. Increase Revenue Per Dollar Spent**\n`;
  if (snap.categoryBreakdown.length > 0) {
    const marketingSpend = snap.categoryBreakdown.find(c => /market|advert|promot/i.test(c.category));
    if (marketingSpend) {
      response += `• Marketing spend: $${fmt(marketingSpend.amount)} (${marketingSpend.percentage.toFixed(0)}% of costs)\n`;
      response += `• Track ROI per channel — double down on what works, cut what doesn't\n`;
    } else {
      response += `• Consider allocating 5-10% of revenue to marketing\n`;
      response += `• Start with low-cost channels (referrals, social media, word of mouth)\n`;
    }
  }
  response += `• Automate repetitive tasks to serve more clients without proportional cost\n\n`;

  // Strategy 3: Targets
  const targetGrowth = Math.max(revenue.trend.changePercent + 5, 10);
  response += `**3. Set 90-Day Growth Targets**\n`;
  response += `• Monthly revenue growth target: **${targetGrowth.toFixed(0)}%**\n`;
  response += `• Revenue goal next quarter: **$${fmt(revenue.monthlyAverage * 3 * (1 + targetGrowth / 100))}**\n`;
  response += `• Weekly check-ins to track progress\n`;

  return response;
}

function generateProfitAdvice(analysis: FinancialAnalysis, snap: FinancialSnapshot): string {
  const { profitability, expenses, revenue } = analysis;
  let response = `## 📈 Profit Improvement Plan\n\n`;

  response += `**Current Margin:** ${profitability.netMargin.toFixed(1)}% `;
  response += profitability.rating === 'excellent' ? '🟢\n' : profitability.rating === 'good' ? '🟡\n' : profitability.rating === 'thin' ? '🟠\n' : '🔴\n';
  response += `**Net ${profitability.netProfit >= 0 ? 'Profit' : 'Loss'}:** $${fmt(Math.abs(profitability.netProfit))}\n\n`;

  // Revenue lever
  const rev5pct = revenue.total * 0.05;
  response += `### Revenue Levers\n`;
  response += `• 5% price increase → **$${fmt(rev5pct)}** additional revenue\n`;
  response += `• Focus on highest-margin services/products\n`;
  response += `• Reduce client churn — retaining 1 client is cheaper than acquiring 2\n\n`;

  // Cost lever
  const exp5pct = expenses.total * 0.05;
  response += `### Cost Levers\n`;
  response += `• 5% expense reduction → **$${fmt(exp5pct)}** saved\n`;
  if (expenses.topCategories.length >= 2) {
    response += `• Focus on #1: **${expenses.topCategories[0].category}** ($${fmt(expenses.topCategories[0].amount)}) and #2: **${expenses.topCategories[1].category}** ($${fmt(expenses.topCategories[1].amount)})\n`;
  }
  response += `• Eliminate subscriptions and services with low ROI\n\n`;

  // Combined impact
  const combinedImprovement = rev5pct + exp5pct;
  const newMargin = snap.totalIncome > 0
    ? ((profitability.netProfit + combinedImprovement) / (snap.totalIncome + rev5pct)) * 100
    : 0;

  response += `### Combined Impact\n`;
  response += `• Combined improvement: **$${fmt(combinedImprovement)}**\n`;
  response += `• New projected margin: **${newMargin.toFixed(1)}%** (from ${profitability.netMargin.toFixed(1)}%)\n`;
  response += `• This is achievable within **60-90 days** with disciplined execution.\n`;

  return response;
}

function generateOptimizationAdvice(analysis: FinancialAnalysis, snap: FinancialSnapshot): string {
  const { expenses, cashflow } = analysis;
  let response = `## ⚡ Financial Optimization Insights\n\n`;

  response += `### Process Efficiency\n`;
  response += `• **Invoice turnaround:** Send invoices the same day you deliver. Faster invoicing = faster payment.\n`;
  response += `• **Automate categorization:** Use AI expense classification to save 2-3 hours/week.\n`;
  response += `• **Batch payments:** Pay suppliers on set dates to improve cash flow predictability.\n\n`;

  response += `### Financial Health Quick Wins\n`;

  if (cashflow.runway < 6) {
    response += `• 🟠 Build cash reserves — target 6 months runway (currently ${cashflow.runway.toFixed(1)} months)\n`;
  }

  if (expenses.topCategories.length > 0 && expenses.topCategories[0].percentage > 40) {
    response += `• ⚠️ Expense concentration risk: **${expenses.topCategories[0].category}** is ${expenses.topCategories[0].percentage.toFixed(0)}% of costs. Diversify.\n`;
  }

  if (snap.invoiceSummary && snap.invoiceSummary.overdue > 0) {
    response += `• 📌 Collect $${fmt(snap.invoiceSummary.overdueValue)} in overdue invoices this week\n`;
  }

  response += `\n### Automation Opportunities\n`;
  response += `• Set up recurring invoices for regular clients\n`;
  response += `• Enable automatic bank import categorization\n`;
  response += `• Schedule monthly financial health reviews with AI\n`;
  response += `• Use AI forecasting to plan 3 months ahead\n`;

  return response;
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Generate business coaching response.
 */
export function generateCoachingResponse(message: string, snap: FinancialSnapshot): string {
  const topic = detectCoachingTopic(message);
  const analysis = analyzeFinancials(snap);

  switch (topic) {
    case 'cost_reduction':
      return generateCostReductionAdvice(analysis, snap);
    case 'growth':
      return generateGrowthAdvice(analysis, snap);
    case 'profit_improvement':
      return generateProfitAdvice(analysis, snap);
    case 'optimization':
      return generateOptimizationAdvice(analysis, snap);
    case 'general':
    default: {
      // Pick the most relevant advice based on data
      if (analysis.profitability.netProfit < 0) {
        return generateProfitAdvice(analysis, snap);
      }
      if (analysis.expenses.spikeDetected) {
        return generateCostReductionAdvice(analysis, snap);
      }
      if (analysis.revenue.declining) {
        return generateGrowthAdvice(analysis, snap);
      }
      return generateOptimizationAdvice(analysis, snap);
    }
  }
}
