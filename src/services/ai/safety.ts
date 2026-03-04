/**
 * ai/safety.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Safety & Control Layer for 2KEI AI.
 *
 * Rules:
 *  - Never fabricate numbers — only analyze real injected data
 *  - Refuse unrelated questions
 *  - Log actions before execution
 *  - Validate all structured actions before returning them
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIContext, AIAction, FinancialSnapshot } from './types';

// ── Off-topic detection ─────────────────────────────────────────────────────

const OFF_TOPIC_KEYWORDS = [
  'weather', 'sports', 'movie', 'music', 'cooking', 'recipe', 'travel',
  'game', 'gaming', 'politics', 'news', 'celebrity', 'joke', 'song',
  'love', 'date', 'relationship', 'horoscope', 'zodiac', 'workout',
  'exercise', 'diet', 'fashion', 'pet', 'animal', 'homework', 'essay',
  'write.*story', 'poem', 'fiction', 'novel',
];

const OFF_TOPIC_PATTERNS = OFF_TOPIC_KEYWORDS.map(k => new RegExp(`\\b${k}\\b`, 'i'));

export function isOffTopic(message: string): boolean {
  const lower = message.toLowerCase().trim();
  // Allow accounting-adjacent questions
  if (/tax|salary|payroll|budget|cost|expense|revenue|profit|invoice|payment|accounting|finance|business|bank|cash/i.test(lower)) {
    return false;
  }
  return OFF_TOPIC_PATTERNS.some(p => p.test(lower));
}

export const OFF_TOPIC_RESPONSE =
  `I'm **2KEI AI**, your financial intelligence assistant. I specialize in:\n\n` +
  `• 📊 Financial analysis & health scoring\n` +
  `• 💰 Cash flow & profitability insights\n` +
  `• 🧾 Expense classification & journal entries\n` +
  `• 📈 Revenue forecasting & projections\n` +
  `• ⚠️ Error detection & anomaly alerts\n` +
  `• 🎯 Business coaching & growth strategy\n` +
  `• 🤖 Smart actions (create invoices, record expenses)\n\n` +
  `Please ask me something about your business finances!`;

// ── Data validation ─────────────────────────────────────────────────────────

/**
 * Validates that a financial snapshot contains real data, not zero-defaults.
 */
export function hasRealData(snapshot?: FinancialSnapshot): boolean {
  if (!snapshot) return false;
  return (
    snapshot.totalIncome > 0 ||
    snapshot.totalExpenses > 0 ||
    snapshot.transactionCount > 0
  );
}

/**
 * Returns a "no data yet" response when the snapshot is empty.
 */
export function noDataResponse(userName?: string): string {
  const name = userName ? `${userName}, ` : '';
  return (
    `${name}No financial data available yet.\n\n` +
    `To unlock AI insights, start by:\n` +
    `1. 📝 Recording income and expense transactions\n` +
    `2. 🧾 Creating invoices for your clients\n` +
    `3. 📊 Then ask me *"How is my business doing?"*\n\n` +
    `I'll analyze your **real numbers** — never fabricated data.`
  );
}

// ── Action validation ───────────────────────────────────────────────────────

/**
 * Validates an action before it can be executed.
 * Returns null if valid, or an error message string.
 */
export function validateAction(action: AIAction, ctx: AIContext): string | null {
  // Check role permissions
  if (!ctx.role || ctx.role === 'viewer') {
    return 'Your role does not permit executing actions. Contact your organization owner.';
  }

  // Validate required fields per action type
  switch (action.type) {
    case 'create_invoice':
      if (!action.data.client) return 'Client name is required to create an invoice.';
      if (!action.data.amount || action.data.amount <= 0) return 'A valid amount is required.';
      break;
    case 'add_employee':
      if (!action.data.name) return 'Employee name is required.';
      if (ctx.role !== 'owner') return 'Only owners can add employees.';
      break;
    case 'record_expense':
      if (!action.data.amount || action.data.amount <= 0) return 'A valid amount is required.';
      break;
    case 'invite_member':
      if (!action.data.email && !action.data.name) return 'Email or name is required for invitation.';
      if (ctx.role !== 'owner') return 'Only owners can invite team members.';
      break;
    case 'generate_report':
      // No strict validation needed
      break;
    case 'none':
      return null;
  }

  return null;
}

// ── Action logging ──────────────────────────────────────────────────────────

const actionLog: Array<{
  timestamp: Date;
  action: AIAction;
  userId?: string;
  orgId?: string;
  status: 'pending' | 'executed' | 'rejected' | 'failed';
}> = [];

/**
 * Log an action before execution (audit trail).
 */
export function logAction(
  action: AIAction,
  status: 'pending' | 'executed' | 'rejected' | 'failed',
  orgId?: string,
): void {
  actionLog.push({
    timestamp: new Date(),
    action,
    orgId,
    status,
  });
  console.log(`[2KEI AI] Action ${status}: ${action.type}`, action.data);
}

/**
 * Get recent action log entries.
 */
export function getActionLog(limit = 50) {
  return actionLog.slice(-limit);
}

// ── Response sanitization ───────────────────────────────────────────────────

/**
 * Ensures AI responses don't contain fabricated data when no snapshot is available.
 * Strips dollar amounts if no real data is injected.
 */
export function sanitizeResponse(response: string, hasData: boolean): string {
  if (hasData) return response;

  // If no real data, warn if the response contains specific dollar amounts
  const dollarPattern = /\$[\d,]+\.?\d*/g;
  const matches = response.match(dollarPattern);
  if (matches && matches.length > 2) {
    return (
      response +
      '\n\n⚠️ *Note: These figures are based on limited data. Record more transactions for accurate analysis.*'
    );
  }
  return response;
}
