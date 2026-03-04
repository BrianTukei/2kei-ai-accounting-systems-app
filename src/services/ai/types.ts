/**
 * ai/types.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Shared types for the 2KEI Financial Intelligence Engine.
 * Every sub-module imports from here — no circular deps.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { OrgRole } from '@/lib/plans';

// ── Financial snapshot (injected from hooks) ───────────────────────────────

export interface FinancialSnapshot {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeGrowth: number;
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

// ── AI Context (everything the engine needs) ───────────────────────────────

export interface AIContext {
  /** The user's message */
  message: string;
  /** Organization ID */
  organizationId?: string;
  /** Current user role */
  role: OrgRole;
  /** Current page/route the user is on */
  currentPage: string;
  /** Financial snapshot from live data */
  financialSnapshot?: FinancialSnapshot;
  /** Conversation history for memory */
  conversationHistory?: AIMessage[];
  /** User display name */
  userName?: string;
  /** Legacy fields for backwards-compat */
  conversationId?: string;
  contextType?: string;
  contextData?: any;
}

// ── Messages ────────────────────────────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  /** If the message contains an executable action */
  action?: AIAction;
}

// ── Actions ─────────────────────────────────────────────────────────────────

export type AIActionType =
  | 'create_invoice'
  | 'add_transaction'
  | 'add_employee'
  | 'record_expense'
  | 'generate_report'
  | 'invite_member'
  | 'navigate'
  | 'create_journal_entry'
  | 'categorize_expense'
  | 'none';

export interface AIAction {
  type: AIActionType;
  data: Record<string, any>;
  /** Human-readable summary of what will happen */
  description: string;
  /** Does this action need user confirmation before executing? */
  requiresConfirmation: boolean;
  /** Was this action executed? */
  executed?: boolean;
  /** Execution result */
  result?: { success: boolean; message: string };
}

// ── AI Response ─────────────────────────────────────────────────────────────

export interface AIResponse {
  success: boolean;
  /** The text response to show the user */
  message: string;
  /** Detected AI mode */
  mode: AIMode;
  /** Optional structured action to execute */
  action?: AIAction;
  /** Conversation ID for persistence */
  conversationId?: string;
  /** Any proactive alerts detected */
  alerts?: AIAlert[];
  /** Metadata for debugging / logging */
  metadata?: Record<string, any>;
}

// ── AI Modes ────────────────────────────────────────────────────────────────

export type AIMode =
  | 'financial_analyst'
  | 'report_explainer'
  | 'billing_assistant'
  | 'payroll_advisor'
  | 'data_validator'
  | 'business_coach'
  | 'action_executor'
  | 'expense_classifier'
  | 'error_detector'
  | 'forecaster'
  | 'navigator'
  | 'general';

// ── Alerts ──────────────────────────────────────────────────────────────────

export interface AIAlert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  category: 'duplicate_transaction' | 'missing_entry' | 'negative_balance'
    | 'unbalanced_journal' | 'expense_spike' | 'revenue_decline'
    | 'cashflow_risk' | 'overdue_invoice' | 'payroll_anomaly' | 'general';
}

// ── Memory ──────────────────────────────────────────────────────────────────

export interface AIMemoryEntry {
  id: string;
  organizationId: string;
  type: 'faq' | 'pattern' | 'action' | 'preference';
  key: string;
  value: any;
  frequency: number;
  lastUsed: Date;
  createdAt: Date;
}

// ── Forecast ────────────────────────────────────────────────────────────────

export interface ForecastResult {
  revenueProjection: Array<{ month: string; projected: number; confidence: number }>;
  expenseProjection: Array<{ month: string; projected: number; confidence: number }>;
  cashRunway: number; // months
  burnRate: number;   // monthly
  breakEvenDate?: string;
  summary: string;
}

// ── Expense Classification ──────────────────────────────────────────────────

export interface ExpenseClassification {
  category: string;
  accountCode: string;
  type: 'expense' | 'income' | 'transfer';
  confidence: number;
  suggestedJournalEntry: {
    debit: { account: string; amount: number };
    credit: { account: string; amount: number };
  };
  description: string;
}

// ── Role permissions for AI ─────────────────────────────────────────────────

export interface AIRoleConfig {
  canExecuteActions: boolean;
  canViewFullInsights: boolean;
  canViewSensitiveData: boolean;
  canModifyData: boolean;
  tone: 'executive' | 'technical' | 'simplified';
  greeting: string;
}
