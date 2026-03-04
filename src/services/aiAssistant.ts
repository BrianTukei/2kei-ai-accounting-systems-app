import { supabase } from '@/integrations/supabase/client';
import { findNavPages, buildNavigationAction } from '@/ai/navigationMap';

/* ═══════════════════════════════════════════════════════════════════════
   2KEI AI – CFO-Grade Accounting Intelligence Engine
   ═══════════════════════════════════════════════════════════════════════
   10 Core Capabilities:
   1. Financial Health Scoring (0-100)
   2. Executive Summary Generation
   3. Profitability & Margin Analysis
   4. Cash Flow Stability Assessment
   5. Error & Anomaly Detection
   6. Expense Efficiency Analysis
   7. Growth Opportunity Identification
   8. Smart Intent Detection (natural language commands)
   9. Risk Assessment & Warnings
   10. Actionable Recommendations
   ═══════════════════════════════════════════════════════════════════════ */

// ── Public types ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface Conversation {
  id: string;
  title: string;
  contextType?: string;
  contextData?: any;
  messages: ChatMessage[];
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  contextType?: string;
  contextData?: any;
  /** Injected by the chat component before calling sendMessage */
  financialSnapshot?: FinancialSnapshot;
  userName?: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  conversationId?: string;
  error?: string;
}

export interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  data?: any;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// ── Financial snapshot (injected from hooks) ────────────────────────────────

export interface FinancialSnapshot {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeGrowth: number;   // % change vs previous month
  expenseGrowth: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  monthlyData: Array<{ name: string; income: number; expenses: number }>;
  invoiceSummary?: {
    total: number;
    paid: number;
    overdue: number;
    draft: number;
    totalValue: number;
    overdueValue: number;
  };
  transactionCount: number;
}

// ── Intent detection ────────────────────────────────────────────────────────

type Intent =
  | 'health_score'
  | 'executive_summary'
  | 'profit_analysis'
  | 'cash_flow'
  | 'expense_analysis'
  | 'risk_areas'
  | 'growth_strategy'
  | 'loss_diagnosis'
  | 'invoice_status'
  | 'report_explain'
  | 'general_accounting'
  | 'navigation'
  | 'greeting'
  | 'off_topic';

const INTENT_PATTERNS: Array<{ intent: Intent; patterns: RegExp[] }> = [
  {
    intent: 'health_score',
    patterns: [
      /health\s*score/i, /financial\s*health/i, /how.*(?:healthy|doing|business\s*doing)/i,
      /rate\s*my/i, /score\s*my/i, /assess\s*my/i, /how\s*am\s*i/i,
    ],
  },
  {
    intent: 'executive_summary',
    patterns: [
      /summar/i, /overview/i, /executive/i, /snapshot/i,
      /tell\s*me\s*about\s*my\s*finance/i, /how\s*are\s*my\s*finance/i,
      /give\s*me\s*a\s*report/i,
    ],
  },
  {
    intent: 'profit_analysis',
    patterns: [
      /profit/i, /margin/i, /profitab/i, /net\s*income/i,
      /am\s*i\s*making\s*money/i, /earning/i, /revenue\s*vs/i,
    ],
  },
  {
    intent: 'cash_flow',
    patterns: [
      /cash\s*flow/i, /liquidity/i, /runway/i, /cash\s*position/i,
      /money\s*coming\s*in/i, /money\s*going\s*out/i,
    ],
  },
  {
    intent: 'expense_analysis',
    patterns: [
      /expense/i, /spending/i, /cost/i, /where.*money\s*go/i,
      /cut\s*cost/i, /reduce\s*spend/i, /overspend/i, /burn\s*rate/i,
    ],
  },
  {
    intent: 'risk_areas',
    patterns: [
      /risk/i, /danger/i, /warning/i, /red\s*flag/i, /concern/i,
      /problem/i, /issue/i, /trouble/i, /worry/i,
    ],
  },
  {
    intent: 'growth_strategy',
    patterns: [
      /grow/i, /scale/i, /strateg/i, /improv/i, /increase\s*revenue/i,
      /boost/i, /opportunity/i, /next\s*step/i, /advice/i,
    ],
  },
  {
    intent: 'loss_diagnosis',
    patterns: [
      /los(?:s|ing)/i, /why.*losing/i, /bleeding/i, /deficit/i,
      /negative/i, /in\s*the\s*red/i, /not\s*profitable/i,
    ],
  },
  {
    intent: 'invoice_status',
    patterns: [
      /invoice/i, /receivable/i, /owed/i, /unpaid/i, /overdue/i,
      /billing/i, /collect/i, /payment.*status/i,
    ],
  },
  {
    intent: 'report_explain',
    patterns: [
      /balance\s*sheet/i, /income\s*statement/i, /trial\s*balance/i,
      /p\s*&\s*l/i, /explain.*report/i, /what\s*is\s*a/i,
    ],
  },
  {
    intent: 'navigation',
    patterns: [
      /where\s*(is|do|can|are)/i, /how\s*do\s*i\s*(find|access|get\s*to|open|see|view|go|create|add|make|record|enter|manage|check|set\s*up|configure)/i,
      /take\s*me\s*to/i, /navigate\s*to/i, /go\s*to/i, /open\s*the/i, /show\s*me\s*(the|where)/i,
      /how\s*to\s*(find|access|get\s*to|open|see|view|go|create|add|make|record|enter|manage)/i,
      /can\s*you\s*(take|show|bring|open)/i, /i\s*want\s*to\s*(go|see|open|find|access|navigate|view)/i,
      /where.*page/i, /where.*section/i, /where.*menu/i, /where.*button/i,
      /find\s*the/i, /looking\s*for/i, /guide\s*me/i, /help\s*me\s*(find|navigate|go|get)/i,
    ],
  },
  {
    intent: 'greeting',
    patterns: [/^(hi|hello|hey|help|good\s*(morning|afternoon|evening))\b/i],
  },
  {
    intent: 'general_accounting',
    patterns: [
      /tax/i, /vat/i, /deductib/i, /payroll/i, /salary/i, /budget/i,
      /forecast/i, /depreciat/i, /amortiz/i, /journal\s*entry/i,
      /debit/i, /credit/i, /accrual/i, /accounting/i,
    ],
  },
];

const OFF_TOPIC_KEYWORDS = [
  'weather', 'sports', 'movie', 'music', 'cooking', 'recipe', 'travel',
  'game', 'politics', 'news', 'celebrity', 'joke', 'song', 'love',
];

function detectIntent(msg: string): Intent {
  const lower = msg.toLowerCase().trim();
  if (OFF_TOPIC_KEYWORDS.some(k => lower.includes(k))) return 'off_topic';
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some(p => p.test(lower))) return intent;
  }
  return 'general_accounting';
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}
function healthEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}
function healthLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Stable';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

// ── Health score calculator ─────────────────────────────────────────────────

function calculateHealthScore(s: FinancialSnapshot): {
  score: number;
  components: Array<{ label: string; score: number; max: number; note: string }>;
} {
  const components: Array<{ label: string; score: number; max: number; note: string }> = [];

  // 1. Profitability (0-25)
  const netMargin = s.totalIncome > 0 ? ((s.totalIncome - s.totalExpenses) / s.totalIncome) * 100 : 0;
  let profitScore = 0;
  if (netMargin >= 20) profitScore = 25;
  else if (netMargin >= 10) profitScore = 20;
  else if (netMargin >= 5) profitScore = 15;
  else if (netMargin > 0) profitScore = 10;
  else profitScore = 0;
  components.push({ label: 'Profitability', score: profitScore, max: 25, note: `Net margin: ${netMargin.toFixed(1)}%` });

  // 2. Revenue Growth (0-20)
  let growthScore = 0;
  if (s.incomeGrowth >= 20) growthScore = 20;
  else if (s.incomeGrowth >= 10) growthScore = 16;
  else if (s.incomeGrowth >= 0) growthScore = 12;
  else if (s.incomeGrowth >= -10) growthScore = 6;
  else growthScore = 0;
  components.push({ label: 'Revenue Growth', score: growthScore, max: 20, note: `Month-over-month: ${fmtPct(s.incomeGrowth)}` });

  // 3. Expense Control (0-20)
  const expenseRatio = s.totalIncome > 0 ? (s.totalExpenses / s.totalIncome) * 100 : 100;
  let expenseScore = 0;
  if (expenseRatio <= 60) expenseScore = 20;
  else if (expenseRatio <= 75) expenseScore = 15;
  else if (expenseRatio <= 90) expenseScore = 10;
  else if (expenseRatio <= 100) expenseScore = 5;
  else expenseScore = 0;
  components.push({ label: 'Expense Control', score: expenseScore, max: 20, note: `Expense ratio: ${expenseRatio.toFixed(1)}%` });

  // 4. Cash Balance (0-15)
  let cashScore = 0;
  const monthlyBurn = s.monthlyExpenses || 1;
  const runwayMonths = s.totalBalance > 0 ? s.totalBalance / monthlyBurn : 0;
  if (runwayMonths >= 6) cashScore = 15;
  else if (runwayMonths >= 3) cashScore = 12;
  else if (runwayMonths >= 1) cashScore = 8;
  else if (s.totalBalance > 0) cashScore = 4;
  else cashScore = 0;
  components.push({ label: 'Cash Reserves', score: cashScore, max: 15, note: `Runway: ${runwayMonths.toFixed(1)} months` });

  // 5. Invoice Health (0-10)
  let invoiceScore = 10;
  if (s.invoiceSummary) {
    const { total, overdue } = s.invoiceSummary;
    if (total > 0) {
      const overdueRate = overdue / total;
      if (overdueRate > 0.3) invoiceScore = 2;
      else if (overdueRate > 0.15) invoiceScore = 5;
      else if (overdueRate > 0) invoiceScore = 8;
    }
  }
  components.push({ label: 'Invoice Collection', score: invoiceScore, max: 10, note: s.invoiceSummary ? `${s.invoiceSummary.overdue} overdue of ${s.invoiceSummary.total}` : 'No invoice data' });

  // 6. Data Quality (0-10)
  let dataScore = 0;
  if (s.transactionCount >= 50) dataScore = 10;
  else if (s.transactionCount >= 20) dataScore = 8;
  else if (s.transactionCount >= 5) dataScore = 5;
  else if (s.transactionCount > 0) dataScore = 2;
  components.push({ label: 'Data Quality', score: dataScore, max: 10, note: `${s.transactionCount} transactions recorded` });

  const score = components.reduce((sum, c) => sum + c.score, 0);
  return { score, components };
}

// ── Error / Anomaly detector ────────────────────────────────────────────────

interface FinancialAlert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

function detectErrors(s: FinancialSnapshot): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  if (s.totalBalance < 0) {
    alerts.push({ severity: 'critical', message: '⚠️ **Negative cash balance** — expenses exceed income. Immediate action required.' });
  }

  if (s.totalExpenses > s.totalIncome && s.totalIncome > 0) {
    const deficit = s.totalExpenses - s.totalIncome;
    alerts.push({ severity: 'critical', message: `⚠️ **Operating at a loss** — spending exceeds revenue by $${fmt(deficit)}.` });
  }

  if (s.expenseGrowth > 20) {
    alerts.push({ severity: 'warning', message: `⚠️ **Expenses surging** — up ${fmtPct(s.expenseGrowth)} this month. Review recent spending.` });
  }

  if (s.incomeGrowth < -15) {
    alerts.push({ severity: 'warning', message: `⚠️ **Revenue declining** — down ${fmtPct(s.incomeGrowth)} this month.` });
  }

  if (s.invoiceSummary && s.invoiceSummary.overdue > 0) {
    alerts.push({
      severity: s.invoiceSummary.overdue >= 5 ? 'critical' : 'warning',
      message: `⚠️ **${s.invoiceSummary.overdue} overdue invoice(s)** — $${fmt(s.invoiceSummary.overdueValue)} uncollected.`,
    });
  }

  const topCategory = s.categoryBreakdown[0];
  if (topCategory && topCategory.percentage > 50) {
    alerts.push({ severity: 'info', message: `📊 **${topCategory.category}** accounts for ${topCategory.percentage.toFixed(0)}% of all expenses — high concentration risk.` });
  }

  if (s.totalIncome === 0 && s.totalExpenses === 0) {
    alerts.push({ severity: 'info', message: '📋 No financial data available yet. Start by recording transactions to get AI insights.' });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════════════════════
// Main AI Engine
// ══════════════════════════════════════════════════════════════════════════════

export class AIAssistantService {

  /**
   * CFO-grade local AI response engine.
   * Analyses real user financial data and returns contextual, data-driven responses.
   */
  static generateLocalResponse(
    message: string,
    contextType?: string,
    contextData?: any,
    financialSnapshot?: FinancialSnapshot,
    userName?: string,
  ): string {
    const intent = detectIntent(message);
    const name = userName ? userName.split(' ')[0] : '';
    const greeting = name ? `${name}, ` : '';
    const s = financialSnapshot;
    const hasData = s && (s.totalIncome > 0 || s.totalExpenses > 0 || s.transactionCount > 0);

    // ── Off-topic guard ──────────────────────────────────────────────────
    if (intent === 'off_topic') {
      return `I'm **2KEI AI**, your financial intelligence assistant. I specialize in accounting, financial analysis, and business strategy.\n\nTry asking me:\n• "How is my business doing?"\n• "Analyze my expenses"\n• "Show risk areas"\n• "Give me a growth strategy"`;
    }

    // ── Greeting ─────────────────────────────────────────────────────────
    if (intent === 'greeting') {
      const base = `Hello${name ? `, ${name}` : ''}! I'm **2KEI AI** — your intelligent financial co-pilot. 🧠\n\nI can analyze your real financial data and provide:\n\n` +
        `• 📊 **Financial Health Score** (0-100)\n` +
        `• 📈 **Profit & Margin Analysis**\n` +
        `• 💰 **Cash Flow Assessment**\n` +
        `• ⚠️ **Error & Risk Detection**\n` +
        `• 🎯 **Growth Strategies**\n` +
        `• 📋 **Executive Summaries**\n` +
        `• 🧭 **System Navigation Guide**\n\n`;
      if (hasData) {
        const { score } = calculateHealthScore(s!);
        return base + `Your current health score is **${score}/100** ${healthEmoji(score)}. Ask me anything about your finances!`;
      }
      return base + `Start by recording some transactions, then ask me "How is my business doing?" for a full analysis.`;
    }

    // ── Navigation works even without financial data ──────────────────
    if (intent === 'navigation') {
      return this.handleNavigation(message, greeting);
    }

    // ── If no financial data available ────────────────────────────────────
    if (!hasData) {
      return `${greeting}No financial data available yet.\n\nTo get personalized AI insights, start by:\n1. Recording income and expense transactions\n2. Creating invoices for your clients\n3. Then ask me "How is my business doing?"\n\nI'll analyze your real numbers and provide actionable intelligence. In the meantime, feel free to ask general accounting questions!`;
    }

    // From here, s is guaranteed to have data
    const snap = s!;
    const netProfit = snap.totalIncome - snap.totalExpenses;
    const netMargin = snap.totalIncome > 0 ? (netProfit / snap.totalIncome) * 100 : 0;
    const expenseRatio = snap.totalIncome > 0 ? (snap.totalExpenses / snap.totalIncome) * 100 : 100;

    // ── Financial Health Score ────────────────────────────────────────────
    if (intent === 'health_score') {
      const { score, components } = calculateHealthScore(snap);
      const alerts = detectErrors(snap);
      let response = `## ${healthEmoji(score)} Financial Health Score: ${score}/100 — ${healthLabel(score)}\n\n`;
      response += `**Score Breakdown:**\n`;
      for (const c of components) {
        const bar = '█'.repeat(Math.round(c.score / c.max * 5)) + '░'.repeat(5 - Math.round(c.score / c.max * 5));
        response += `• ${c.label}: **${c.score}/${c.max}** ${bar} — ${c.note}\n`;
      }
      if (alerts.length > 0) {
        response += `\n**Active Alerts:**\n`;
        for (const a of alerts) response += `${a.message}\n`;
      }
      response += `\n**Recommendation:** `;
      if (score >= 80) response += `Your finances are strong. Focus on growth and investment opportunities.`;
      else if (score >= 60) response += `Your business is stable but there's room to optimize. Focus on the lowest-scoring areas above.`;
      else if (score >= 40) response += `Several areas need attention. Prioritize cost control and revenue growth.`;
      else response += `Immediate intervention needed. Focus on stopping cash bleeding and boosting revenue.`;
      return response;
    }

    // ── Executive Summary ────────────────────────────────────────────────
    if (intent === 'executive_summary') {
      const { score } = calculateHealthScore(snap);
      const alerts = detectErrors(snap);
      let response = `## 📋 Executive Financial Summary\n\n`;
      response += `**Health Score:** ${score}/100 ${healthEmoji(score)} (${healthLabel(score)})\n\n`;
      response += `**Key Metrics:**\n`;
      response += `• Total Revenue: **$${fmt(snap.totalIncome)}**\n`;
      response += `• Total Expenses: **$${fmt(snap.totalExpenses)}**\n`;
      response += `• Net ${netProfit >= 0 ? 'Profit' : 'Loss'}: **$${fmt(Math.abs(netProfit))}** ${netProfit >= 0 ? '✅' : '❌'}\n`;
      response += `• Net Margin: **${netMargin.toFixed(1)}%**\n`;
      response += `• This Month Income: **$${fmt(snap.monthlyIncome)}** (${fmtPct(snap.incomeGrowth)} vs last month)\n`;
      response += `• This Month Expenses: **$${fmt(snap.monthlyExpenses)}** (${fmtPct(snap.expenseGrowth)} vs last month)\n`;
      response += `• Cash Balance: **$${fmt(snap.totalBalance)}**\n`;
      if (snap.invoiceSummary) {
        response += `• Invoices: **${snap.invoiceSummary.paid}** paid, **${snap.invoiceSummary.overdue}** overdue, **${snap.invoiceSummary.draft}** draft\n`;
      }
      response += `\n**3 Key Insights:**\n`;
      // Insight 1: Profitability
      if (netProfit > 0) response += `1. ✅ Your business is **profitable** with a ${netMargin.toFixed(1)}% net margin.\n`;
      else response += `1. ❌ Your business is **operating at a loss**. Expenses exceed revenue by $${fmt(Math.abs(netProfit))}.\n`;
      // Insight 2: Growth trend
      if (snap.incomeGrowth > 0) response += `2. 📈 Revenue is **growing** ${fmtPct(snap.incomeGrowth)} month-over-month — positive momentum.\n`;
      else if (snap.incomeGrowth < 0) response += `2. 📉 Revenue is **declining** ${fmtPct(snap.incomeGrowth)} — needs attention.\n`;
      else response += `2. ➡️ Revenue is **flat** compared to last month.\n`;
      // Insight 3: Top expense
      if (snap.categoryBreakdown.length > 0) {
        const top = snap.categoryBreakdown[0];
        response += `3. 💰 Biggest expense: **${top.category}** at $${fmt(top.amount)} (${top.percentage.toFixed(0)}% of total expenses).\n`;
      }
      if (alerts.filter(a => a.severity !== 'info').length > 0) {
        response += `\n**⚠️ Active Warnings:**\n`;
        for (const a of alerts.filter(al => al.severity !== 'info')) response += `${a.message}\n`;
      }
      return response;
    }

    // ── Profit / Margin Analysis ─────────────────────────────────────────
    if (intent === 'profit_analysis') {
      let response = `## 📈 Profitability Analysis\n\n`;
      response += `• **Total Revenue:** $${fmt(snap.totalIncome)}\n`;
      response += `• **Total Expenses:** $${fmt(snap.totalExpenses)}\n`;
      response += `• **Net ${netProfit >= 0 ? 'Profit' : 'Loss'}:** $${fmt(Math.abs(netProfit))} ${netProfit >= 0 ? '✅' : '❌'}\n`;
      response += `• **Net Margin:** ${netMargin.toFixed(1)}%\n`;
      response += `• **Expense Ratio:** ${expenseRatio.toFixed(1)}% of revenue goes to expenses\n\n`;
      // Rating
      if (netMargin >= 20) response += `**Rating: Excellent** 🟢 — Your margins are strong. You're retaining over 20¢ of every dollar earned.\n`;
      else if (netMargin >= 10) response += `**Rating: Good** 🟡 — Healthy margins, but there's room to optimize.\n`;
      else if (netMargin >= 0) response += `**Rating: Thin** 🟠 — Barely profitable. Small changes in expenses could tip you into loss.\n`;
      else response += `**Rating: Unprofitable** 🔴 — Operating at a loss. Reduce costs or increase revenue immediately.\n`;
      response += `\n**3 Actions to Improve Profitability:**\n`;
      response += `1. Review your top expense category (**${snap.categoryBreakdown[0]?.category || 'N/A'}**) for potential cuts\n`;
      response += `2. ${netMargin < 10 ? 'Consider raising prices by 5-10% on high-value services' : 'Explore upselling or cross-selling to existing clients'}\n`;
      response += `3. ${snap.expenseGrowth > 10 ? 'Urgently slow expense growth — costs are rising faster than revenue' : 'Maintain cost discipline while investing in revenue drivers'}\n`;
      return response;
    }

    // ── Cash Flow Analysis ───────────────────────────────────────────────
    if (intent === 'cash_flow') {
      const monthlyBurn = snap.monthlyExpenses || 1;
      const runway = snap.totalBalance > 0 ? snap.totalBalance / monthlyBurn : 0;
      const monthlyNet = snap.monthlyIncome - snap.monthlyExpenses;
      let response = `## 💰 Cash Flow Analysis\n\n`;
      response += `• **Cash Balance:** $${fmt(snap.totalBalance)} ${snap.totalBalance > 0 ? '✅' : '⚠️'}\n`;
      response += `• **Monthly Inflow:** $${fmt(snap.monthlyIncome)} (${fmtPct(snap.incomeGrowth)})\n`;
      response += `• **Monthly Outflow:** $${fmt(snap.monthlyExpenses)} (${fmtPct(snap.expenseGrowth)})\n`;
      response += `• **Monthly Net Cash:** $${fmt(monthlyNet)} ${monthlyNet >= 0 ? '✅' : '❌'}\n`;
      response += `• **Cash Runway:** ${runway.toFixed(1)} months\n\n`;
      if (runway >= 6) response += `**Status: Strong** 🟢 — Over 6 months of runway. Good cash cushion.\n`;
      else if (runway >= 3) response += `**Status: Adequate** 🟡 — 3-6 months runway. Consider building reserves.\n`;
      else if (runway > 0) response += `**Status: Low** 🟠 — Under 3 months runway. Accelerate collections and reduce spend.\n`;
      else response += `**Status: Critical** 🔴 — Negative or zero runway. Cash emergency.\n`;
      if (snap.invoiceSummary && snap.invoiceSummary.overdueValue > 0) {
        response += `\n📌 **Collecting $${fmt(snap.invoiceSummary.overdueValue)} in overdue invoices would add ${(snap.invoiceSummary.overdueValue / monthlyBurn).toFixed(1)} months of runway.**`;
      }
      response += `\n\n**Tips to Improve Cash Flow:**\n`;
      response += `• Invoice immediately after delivering services\n`;
      response += `• Follow up on overdue invoices weekly\n`;
      response += `• Negotiate 45-60 day payment terms with suppliers\n`;
      response += `• Maintain a 3-month emergency cash reserve\n`;
      return response;
    }

    // ── Expense Analysis ─────────────────────────────────────────────────
    if (intent === 'expense_analysis') {
      let response = `## 📊 Expense Analysis\n\n`;
      response += `• **Total Expenses:** $${fmt(snap.totalExpenses)}\n`;
      response += `• **This Month:** $${fmt(snap.monthlyExpenses)} (${fmtPct(snap.expenseGrowth)} vs last month)\n`;
      response += `• **Expense Ratio:** ${expenseRatio.toFixed(1)}% of revenue\n\n`;
      if (snap.categoryBreakdown.length > 0) {
        response += `**Expense Breakdown by Category:**\n`;
        for (const cat of snap.categoryBreakdown.slice(0, 8)) {
          const bar = '█'.repeat(Math.round(cat.percentage / 10)) + '░'.repeat(10 - Math.round(cat.percentage / 10));
          response += `• **${cat.category}:** $${fmt(cat.amount)} (${cat.percentage.toFixed(1)}%) ${bar}\n`;
        }
      }
      response += `\n**Efficiency Assessment:**\n`;
      if (expenseRatio <= 60) response += `✅ Excellent expense control — only ${expenseRatio.toFixed(0)}% of revenue goes to costs.\n`;
      else if (expenseRatio <= 80) response += `🟡 Moderate — ${expenseRatio.toFixed(0)}% of revenue consumed by expenses. Room to optimize.\n`;
      else response += `🔴 High expense ratio — ${expenseRatio.toFixed(0)}% of revenue consumed. Cost reduction needed urgently.\n`;
      response += `\n**3 Recommended Actions:**\n`;
      if (snap.categoryBreakdown.length >= 2) {
        response += `1. Audit your top category (**${snap.categoryBreakdown[0].category}**) — it's ${snap.categoryBreakdown[0].percentage.toFixed(0)}% of all spending\n`;
        response += `2. Look for overlapping costs in **${snap.categoryBreakdown[1]?.category || 'secondary categories'}**\n`;
      }
      response += `3. ${snap.expenseGrowth > 10 ? 'Set strict monthly budget caps — expenses are growing fast' : 'Maintain discipline and set quarterly review checkpoints'}\n`;
      return response;
    }

    // ── Risk Areas ───────────────────────────────────────────────────────
    if (intent === 'risk_areas') {
      const alerts = detectErrors(snap);
      let response = `## ⚠️ Risk Assessment\n\n`;
      if (alerts.length === 0) {
        response += `✅ **No major risks detected.** ${greeting}your finances appear stable.\n\nKeep monitoring your numbers regularly for early warning signs.`;
        return response;
      }
      const critical = alerts.filter(a => a.severity === 'critical');
      const warnings = alerts.filter(a => a.severity === 'warning');
      const info = alerts.filter(a => a.severity === 'info');
      if (critical.length > 0) {
        response += `**🔴 Critical Issues (${critical.length}):**\n`;
        for (const a of critical) response += `${a.message}\n`;
        response += '\n';
      }
      if (warnings.length > 0) {
        response += `**🟡 Warnings (${warnings.length}):**\n`;
        for (const a of warnings) response += `${a.message}\n`;
        response += '\n';
      }
      if (info.length > 0) {
        response += `**ℹ️ Observations (${info.length}):**\n`;
        for (const a of info) response += `${a.message}\n`;
        response += '\n';
      }
      response += `**Mitigation Plan:**\n`;
      if (critical.length > 0) response += `1. Address critical issues within **24-48 hours**\n`;
      if (warnings.length > 0) response += `2. Review warnings within **1 week**\n`;
      response += `3. Schedule a monthly financial review to catch issues early\n`;
      return response;
    }

    // ── Growth Strategy ──────────────────────────────────────────────────
    if (intent === 'growth_strategy') {
      let response = `## 🚀 Growth Strategy\n\n`;
      response += `Based on your financial data, here's a personalized growth plan:\n\n`;
      response += `**Current Position:**\n`;
      response += `• Revenue: $${fmt(snap.totalIncome)} | Growth: ${fmtPct(snap.incomeGrowth)}/mo\n`;
      response += `• Net Margin: ${netMargin.toFixed(1)}%\n`;
      response += `• Cash Reserves: $${fmt(snap.totalBalance)}\n\n`;
      response += `**3 Growth Strategies:**\n\n`;
      // Strategy based on current position
      if (netMargin >= 15) {
        response += `1. **Invest in Revenue Channels** — Your margins are healthy. Allocate 10-15% of profit to marketing and sales to accelerate growth.\n\n`;
      } else if (netMargin >= 0) {
        response += `1. **Optimize Before Scaling** — Improve margins to 15%+ before investing in growth. Cut lowest-ROI expenses first.\n\n`;
      } else {
        response += `1. **Fix Profitability First** — Reduce costs by ${Math.min(expenseRatio - 80, 30).toFixed(0)}% or increase prices before pursuing growth.\n\n`;
      }
      if (snap.invoiceSummary && snap.invoiceSummary.overdue > 0) {
        response += `2. **Collect Outstanding Revenue** — $${fmt(snap.invoiceSummary.overdueValue)} in overdue invoices is immediate growth capital. Follow up this week.\n\n`;
      } else {
        response += `2. **Diversify Revenue Streams** — Add complementary products/services to reduce dependency on a single income source.\n\n`;
      }
      response += `3. **Set 90-Day Targets** — Aim for ${fmtPct(Math.max(snap.incomeGrowth + 5, 10))} monthly revenue growth with a weekly check-in cadence.\n`;
      return response;
    }

    // ── Loss Diagnosis ───────────────────────────────────────────────────
    if (intent === 'loss_diagnosis') {
      let response = `## 🩺 Loss Diagnosis\n\n`;
      if (netProfit >= 0) {
        response += `${greeting}Good news — you're actually **profitable** with $${fmt(netProfit)} net income (${netMargin.toFixed(1)}% margin).\n\n`;
        response += `However, here are areas to watch to **stay** profitable:\n`;
        if (snap.expenseGrowth > 5) response += `• Expenses grew ${fmtPct(snap.expenseGrowth)} this month — faster than ideal\n`;
        if (snap.incomeGrowth < 0) response += `• Revenue declined ${fmtPct(snap.incomeGrowth)} — needs reversal\n`;
        if (snap.invoiceSummary?.overdue) response += `• ${snap.invoiceSummary.overdue} overdue invoices need collection\n`;
        return response;
      }
      response += `${greeting}Your business is currently **operating at a loss** of $${fmt(Math.abs(netProfit))}.\n\n`;
      response += `**Root Cause Analysis:**\n`;
      response += `• Expense ratio is ${expenseRatio.toFixed(1)}% — you spend $${fmt(expenseRatio / 100)} for every $1 earned\n`;
      if (snap.categoryBreakdown.length > 0) {
        response += `• Top cost driver: **${snap.categoryBreakdown[0].category}** at $${fmt(snap.categoryBreakdown[0].amount)} (${snap.categoryBreakdown[0].percentage.toFixed(0)}% of expenses)\n`;
      }
      if (snap.incomeGrowth < 0) response += `• Revenue is declining ${fmtPct(snap.incomeGrowth)} — compounding the loss\n`;
      if (snap.expenseGrowth > 0) response += `• Expenses growing ${fmtPct(snap.expenseGrowth)} — accelerating the burn\n`;
      response += `\n**Recovery Plan:**\n`;
      response += `1. **Immediate:** Cut or renegotiate top 2 expense categories\n`;
      response += `2. **This Week:** Follow up on all outstanding invoices\n`;
      response += `3. **This Month:** Raise prices or add higher-margin services\n`;
      response += `4. **Ongoing:** Track weekly P&L instead of monthly for faster response\n`;
      return response;
    }

    // ── Invoice Status ───────────────────────────────────────────────────
    if (intent === 'invoice_status') {
      if (!snap.invoiceSummary || snap.invoiceSummary.total === 0) {
        return `${greeting}You haven't created any invoices yet.\n\nGo to **Invoices** to create your first invoice and start tracking payments. Once you do, I'll analyze your collection efficiency and outstanding receivables.`;
      }
      const inv = snap.invoiceSummary;
      let response = `## 🧾 Invoice Status Report\n\n`;
      response += `• **Total Invoices:** ${inv.total}\n`;
      response += `• **Paid:** ${inv.paid} ✅\n`;
      response += `• **Overdue:** ${inv.overdue} ${inv.overdue > 0 ? '⚠️' : '✅'}\n`;
      response += `• **Draft:** ${inv.draft}\n`;
      response += `• **Total Value:** $${fmt(inv.totalValue)}\n`;
      response += `• **Overdue Amount:** $${fmt(inv.overdueValue)}\n\n`;
      const collectionRate = inv.total > 0 ? (inv.paid / inv.total * 100) : 0;
      response += `**Collection Rate:** ${collectionRate.toFixed(0)}%\n`;
      if (collectionRate >= 80) response += `🟢 Excellent collection performance.\n`;
      else if (collectionRate >= 60) response += `🟡 Decent, but aim for 80%+ collection rate.\n`;
      else response += `🔴 Low collection rate. Review your invoicing and follow-up process.\n`;
      if (inv.overdue > 0) {
        response += `\n**Action Required:** Follow up on ${inv.overdue} overdue invoice(s) worth $${fmt(inv.overdueValue)} immediately.`;
      }
      return response;
    }

    // ── Report Explanation ───────────────────────────────────────────────
    if (intent === 'report_explain') {
      return this.handleReportExplanation(message, contextType, contextData, snap);
    }

    // ── General Accounting Q&A ───────────────────────────────────────────
    if (intent === 'general_accounting') {
      return this.handleGeneralAccounting(message, snap);
    }

    // ── Navigation Guide ──────────────────────────────────────────────────
    if (intent === 'navigation') {
      return this.handleNavigation(message, greeting);
    }

    // ── Fallback ─────────────────────────────────────────────────────────
    return `${greeting}I can help you with that! Here's what I can analyze:\n\n` +
      `• **"How is my business doing?"** — Financial health score\n` +
      `• **"Summarize my finances"** — Executive summary\n` +
      `• **"Analyze my profits"** — Margin analysis\n` +
      `• **"Cash flow status"** — Liquidity assessment\n` +
      `• **"Show risk areas"** — Error & anomaly detection\n` +
      `• **"Why am I losing money?"** — Loss diagnosis\n` +
      `• **"Give me a growth strategy"** — Actionable growth plan\n` +
      `• **"Invoice status"** — Receivables report\n` +
      `• **"Analyze my expenses"** — Spending breakdown\n` +
      `• **"Where do I find..."** — System navigation guide 🧭\n\n` +
      `All analysis is based on your real financial data — no fake numbers.`;
  }

  // ── Sub-handlers ──────────────────────────────────────────────────────

  /**
   * Navigation Guide handler – matches user query to system pages
   * and returns step-by-step instructions with a navigation JSON action.
   */
  private static handleNavigation(message: string, greeting: string): string {
    const pages = findNavPages(message);

    if (pages.length === 0) {
      return `${greeting}I couldn't find a matching page for that. Here are some things you can ask:\n\n` +
        `• **"Where do I add a transaction?"**\n` +
        `• **"How do I create an invoice?"**\n` +
        `• **"Take me to reports"**\n` +
        `• **"Where is the payroll page?"**\n` +
        `• **"How do I import bank statements?"**\n` +
        `• **"Show me the balance sheet"**\n\n` +
        `I can guide you to any page in the system!`;
    }

    const top = pages[0];
    const navAction = buildNavigationAction(top);

    let response = `## 🧭 ${top.name}\n\n`;
    response += `**Here's how to get there:**\n\n`;
    top.steps.forEach((step, i) => {
      response += `${i + 1}. ${step}\n`;
    });

    // If there are additional relevant pages, mention them
    if (pages.length > 1) {
      response += `\n**Related pages:**\n`;
      for (const p of pages.slice(1, 4)) {
        response += `• **${p.name}** — \`${p.path}\`\n`;
      }
    }

    // Embed the navigation action JSON (parsed by AIChat component)
    response += `\n\n<!--NAV_ACTION:${JSON.stringify(navAction)}-->`;

    return response;
  }

  private static handleReportExplanation(message: string, contextType?: string, contextData?: any, snap?: FinancialSnapshot): string {
    const msg = message.toLowerCase();

    if ((contextType === 'report' && contextData?.reportType?.toLowerCase().includes('balance')) || msg.includes('balance sheet')) {
      let r = `## ⚖️ Balance Sheet Explained\n\nA Balance Sheet shows your company's financial position at a specific point in time.\n\n` +
        `**The Equation:** Assets = Liabilities + Equity\n\n` +
        `• **Assets** — What you own (cash, receivables, inventory, equipment)\n` +
        `• **Liabilities** — What you owe (payables, loans, accrued expenses)\n` +
        `• **Equity** — Owner's value (Assets minus Liabilities)\n\n`;
      if (snap) {
        r += `**Your Current Position:**\n`;
        r += `• Cash/Balance: $${fmt(snap.totalBalance)}\n`;
        r += `• Total inflows (proxy for assets): $${fmt(snap.totalIncome)}\n`;
        r += `• Total outflows (proxy for liabilities): $${fmt(snap.totalExpenses)}\n`;
        r += `• Net Position: $${fmt(snap.totalBalance)} ${snap.totalBalance >= 0 ? '✅' : '⚠️'}\n`;
      }
      return r;
    }

    if ((contextType === 'report' && (contextData?.reportType?.toLowerCase().includes('income') || contextData?.reportType?.toLowerCase().includes('profit'))) || msg.includes('income statement') || /p\s*&?\s*l/i.test(msg)) {
      let r = `## 📊 Income Statement (P&L) Explained\n\n` +
        `Shows profitability over a period of time.\n\n` +
        `**Formula:** Revenue − Expenses = Net Income\n\n` +
        `Key margins to track:\n` +
        `• **Gross Margin** = (Revenue − COGS) / Revenue × 100\n` +
        `• **Operating Margin** = Operating Income / Revenue × 100\n` +
        `• **Net Margin** = Net Income / Revenue × 100\n\n`;
      if (snap) {
        const nm = snap.totalIncome > 0 ? ((snap.totalIncome - snap.totalExpenses) / snap.totalIncome * 100) : 0;
        r += `**Your Numbers:**\n`;
        r += `• Revenue: $${fmt(snap.totalIncome)}\n`;
        r += `• Expenses: $${fmt(snap.totalExpenses)}\n`;
        r += `• Net Income: $${fmt(snap.totalIncome - snap.totalExpenses)}\n`;
        r += `• Net Margin: ${nm.toFixed(1)}% ${nm >= 10 ? '✅' : nm >= 0 ? '🟡' : '❌'}\n`;
      }
      return r;
    }

    if ((contextType === 'report' && contextData?.reportType?.toLowerCase().includes('cash')) || msg.includes('cash flow')) {
      return `## 💰 Cash Flow Statement Explained\n\nShows how money moves through your business:\n\n` +
        `• **Operating Activities** — Day-to-day income & expenses\n` +
        `• **Investing Activities** — Equipment, assets, investments\n` +
        `• **Financing Activities** — Loans, owner contributions, dividends\n\n` +
        `Positive operating cash flow is the strongest sign of business health.` +
        (snap ? `\n\n**Your Cash Position:** $${fmt(snap.totalBalance)} | Monthly net: $${fmt(snap.monthlyIncome - snap.monthlyExpenses)}` : '');
    }

    if (msg.includes('trial balance')) {
      return `## 📋 Trial Balance Explained\n\nA Trial Balance lists all accounts with their debit and credit balances to verify that **Total Debits = Total Credits**.\n\n` +
        `• If they don't balance, there's a recording error\n` +
        `• Prepared before financial statements\n` +
        `• Helps catch double entries, missing entries, or incorrect amounts\n\n` +
        `It's your first checkpoint for clean accounting.`;
    }

    return `I can explain any financial report. Try asking about:\n• Balance Sheet\n• Income Statement\n• Cash Flow Statement\n• Trial Balance`;
  }

  private static handleGeneralAccounting(message: string, snap?: FinancialSnapshot): string {
    const msg = message.toLowerCase();

    if (msg.includes('tax') || msg.includes('vat') || msg.includes('deductib')) {
      return `## 🧾 Tax & Deductions Guide\n\n` +
        `**Common Deductible Expenses:**\n` +
        `• Office rent & utilities\n• Employee salaries & benefits\n• Marketing & advertising\n` +
        `• Professional services (accountant, lawyer)\n• Equipment & software\n• Business travel\n` +
        `• Insurance premiums\n\n` +
        `**Best Practices:**\n` +
        `1. Keep digital receipts for everything\n2. Separate personal and business finances\n` +
        `3. Set aside 25-30% of profit quarterly for taxes\n4. Track mileage and business meals\n\n` +
        `⚠️ Always consult a qualified tax professional for advice specific to your jurisdiction.` +
        (snap ? `\n\n**Your tax-relevant data:** Revenue $${fmt(snap.totalIncome)} | Deductible expenses $${fmt(snap.totalExpenses)}` : '');
    }

    if (msg.includes('payroll') || msg.includes('salary') || msg.includes('employee')) {
      return `## 👥 Payroll Management\n\n` +
        `**Key Components:**\n• Gross Pay → Deductions (PAYE, NSSF, NHIF) → Net Pay\n• Track employer-side taxes separately\n\n` +
        `**Best Practices:**\n1. Record gross pay, deductions, and net pay in separate accounts\n` +
        `2. Issue payslips every pay period\n3. Reconcile payroll accounts monthly\n` +
        `4. Maintain employee records for compliance\n5. Budget for employer-side contributions (usually 10-15% above gross)\n`;
    }

    if (msg.includes('budget') || msg.includes('forecast')) {
      return `## 🎯 Budgeting & Forecasting\n\n` +
        `**How to Build a Budget:**\n1. Start with last period's actual figures\n2. Separate fixed costs (rent, salaries) from variable costs\n` +
        `3. Project revenue conservatively (80% of pipeline)\n4. Build in a 10-15% contingency buffer\n\n` +
        `**Review Cadence:**\n• Weekly: Cash flow check\n• Monthly: Budget vs actuals review\n• Quarterly: Forecast adjustment\n` +
        (snap ? `\n\n**Your baseline:** Monthly income $${fmt(snap.monthlyIncome)} | Monthly expenses $${fmt(snap.monthlyExpenses)}` : '');
    }

    if (msg.includes('depreciat') || msg.includes('amortiz')) {
      return `## 📉 Depreciation & Amortization\n\n` +
        `**Depreciation** = Spreading the cost of tangible assets (equipment, vehicles) over their useful life.\n` +
        `**Amortization** = Same concept for intangible assets (patents, software licenses).\n\n` +
        `**Common Methods:**\n• Straight-line (equal annual amounts)\n• Declining balance (higher early, lower later)\n• Units of production (based on usage)\n\n` +
        `This reduces your taxable income each year without cash outflow.`;
    }

    if (msg.includes('debit') || msg.includes('credit') || msg.includes('journal') || msg.includes('accrual')) {
      return `## 📒 Double-Entry Bookkeeping\n\n` +
        `Every transaction affects **two accounts**: one debit, one credit.\n\n` +
        `**The Rules:**\n• Assets & Expenses **increase** with debits\n• Liabilities, Equity & Revenue **increase** with credits\n• Debits must equal Credits\n\n` +
        `**Example:** You receive $1,000 payment:\n• Debit: Cash (asset ↑)\n• Credit: Revenue (income ↑)\n\n` +
        `**Accrual Accounting:** Record transactions when they occur, not when cash moves.`;
    }

    // Generic fallback for accounting topics
    return `That's a great accounting question! Here's what I can help with:\n\n` +
      `• **Tax & Deductions** — Deductible expenses, tax planning\n` +
      `• **Payroll** — Salary management, compliance\n` +
      `• **Budgeting** — Forecasting, budget vs actuals\n` +
      `• **Bookkeeping** — Debits, credits, journal entries\n` +
      `• **Depreciation** — Asset cost allocation\n\n` +
      `Or ask about your actual data:\n` +
      `• "How is my business doing?" — Health score analysis\n` +
      `• "Analyze my expenses" — Spending breakdown\n` +
      `• "Show risk areas" — Anomaly detection\n`;
  }

  /**
   * Send a message to the AI assistant.
   * Uses CFO-grade local engine with real financial data.
   * Falls back to edge function if available, otherwise local.
   */
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      console.log('2KEI AI processing:', request.message.slice(0, 60));

      // Try edge function first (if configured)
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: request
        });
        if (!error && data?.success && data?.response) {
          return data;
        }
      } catch {
        // Edge function unavailable — continue with local engine
      }

      // CFO-grade local engine with real data
      console.log('Using 2KEI AI local engine');
      const localResponse = this.generateLocalResponse(
        request.message,
        request.contextType,
        request.contextData,
        request.financialSnapshot,
        request.userName,
      );
      return {
        success: true,
        response: localResponse,
        conversationId: request.conversationId || `local-${Date.now()}`
      };
    } catch (error: any) {
      console.log('2KEI AI fallback:', error?.message);
      const localResponse = this.generateLocalResponse(
        request.message,
        request.contextType,
        request.contextData,
        request.financialSnapshot,
        request.userName,
      );
      return {
        success: true,
        response: localResponse,
        conversationId: request.conversationId || `local-${Date.now()}`
      };
    }
  }

  /**
   * Get user's conversations
   */
  static async getConversations(): Promise<Conversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          const { data: messages } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          return {
            id: conv.id,
            title: conv.title,
            contextType: conv.context_type,
            contextData: conv.context_data,
            messages: messages?.map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              metadata: msg.metadata
            })) || [],
            updatedAt: new Date(conv.updated_at)
          };
        })
      );

      return conversationsWithMessages;
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Get a specific conversation with messages
   */
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data: conversation, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return null;
      }

      const { data: messages } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return {
        id: conversation.id,
        title: conversation.title,
        contextType: conversation.context_type,
        contextData: conversation.context_data,
        messages: messages?.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        })) || [],
        updatedAt: new Date(conversation.updated_at)
      };
    } catch (error: any) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      return !error;
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId);

      return !error;
    } catch (error: any) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  }

  /**
   * Get AI insights for the current user
   */
  static async getInsights(): Promise<AIInsight[]> {
    try {
      const { data: insights, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return insights?.map(insight => ({
        id: insight.id,
        type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        data: insight.data,
        severity: insight.severity as 'info' | 'warning' | 'critical',
        isRead: insight.is_read,
        createdAt: new Date(insight.created_at),
        expiresAt: insight.expires_at ? new Date(insight.expires_at) : undefined
      })) || [];
    } catch (error: any) {
      console.error('Error fetching AI insights:', error);
      return [];
    }
  }

  /**
   * Mark insight as read
   */
  static async markInsightAsRead(insightId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId);

      return !error;
    } catch (error: any) {
      console.error('Error marking insight as read:', error);
      return false;
    }
  }

  /**
   * Get AI analysis for specific report data
   */
  static async analyzeReport(reportType: string, reportData: any): Promise<ChatResponse> {
    return this.sendMessage({
      message: `Please analyze this ${reportType} report and provide insights.`,
      contextType: 'report',
      contextData: {
        reportType,
        reportData
      }
    });
  }

  /**
   * Get AI suggestions for expense categorization
   */
  static async categorizeExpense(description: string, amount: number, vendor?: string): Promise<ChatResponse> {
    return this.sendMessage({
      message: `How should I categorize this expense: "${description}" for ${amount}${vendor ? ` from ${vendor}` : ''}? What's the best expense category?`,
      contextType: 'transaction',
      contextData: {
        type: 'expense_categorization',
        description,
        amount,
        vendor
      }
    });
  }

  /**
   * Generate AI insights based on user's financial data
   */
  static async generateFinancialInsights(financialData: any): Promise<ChatResponse> {
    return this.sendMessage({
      message: 'Based on my current financial data, what insights and recommendations do you have?',
      contextType: 'dashboard',
      contextData: {
        type: 'financial_analysis',
        data: financialData
      }
    });
  }

  /**
   * Get help with accounting principles
   */
  static async getAccountingHelp(topic: string): Promise<ChatResponse> {
    return this.sendMessage({
      message: `Can you explain ${topic} in accounting? Provide practical examples.`,
      contextType: 'general',
      contextData: {
        type: 'accounting_education',
        topic
      }
    });
  }
}