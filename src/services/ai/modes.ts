/**
 * ai/modes.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Multi-Mode AI Behavior — automatically switches mode based on:
 *   1. Current page/route the user is viewing
 *   2. Detected intent from the user's message
 *
 * Each mode adjusts the system prompt, available tools, and response style.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIMode } from './types';

// ── Page → Mode mapping ────────────────────────────────────────────────────

interface ModeConfig {
  mode: AIMode;
  label: string;
  systemContext: string;
  quickSuggestions: string[];
}

const PAGE_MODE_MAP: Record<string, ModeConfig> = {
  '/dashboard': {
    mode: 'financial_analyst',
    label: 'Financial Analyst',
    systemContext: 'You are analyzing the dashboard overview. Focus on key metrics, trends, and actionable insights. Highlight anything unusual.',
    quickSuggestions: [
      'How is my business doing?',
      'What changed since last month?',
      'Show me risk areas',
      'Give me an executive summary',
    ],
  },
  '/transactions': {
    mode: 'expense_classifier',
    label: 'Transaction Advisor',
    systemContext: 'You are helping with transactions. Assist with categorization, detect duplicates, and suggest proper accounting treatment.',
    quickSuggestions: [
      'Categorize my recent transactions',
      'Find duplicate entries',
      'Record an expense',
      'Show spending by category',
    ],
  },
  '/reports': {
    mode: 'report_explainer',
    label: 'Report Explainer',
    systemContext: 'You are explaining financial reports. Break down what each number means, highlight important trends, and suggest actions.',
    quickSuggestions: [
      'Explain this report',
      'What do these numbers mean?',
      'Compare to last period',
      'What should I focus on?',
    ],
  },
  '/invoices': {
    mode: 'billing_assistant',
    label: 'Billing Assistant',
    systemContext: 'You are managing invoicing and billing. Help create invoices, track payments, follow up on overdue items.',
    quickSuggestions: [
      'Create an invoice',
      'Show overdue invoices',
      'Draft a payment reminder',
      'Invoice collection rate',
    ],
  },
  '/payroll': {
    mode: 'payroll_advisor',
    label: 'Payroll Advisor',
    systemContext: 'You are advising on payroll. Help with salary calculations, tax obligations, and payroll compliance.',
    quickSuggestions: [
      'Add new employee',
      'Calculate payroll taxes',
      'Payroll summary',
      'Show payroll anomalies',
    ],
  },
  '/bank-import': {
    mode: 'data_validator',
    label: 'Data Validator',
    systemContext: 'You are validating imported bank data. Check for duplicates, miscategorizations, missing entries, and data quality issues.',
    quickSuggestions: [
      'Validate my import',
      'Find duplicates',
      'Auto-categorize entries',
      'Check data quality',
    ],
  },
  '/forecast': {
    mode: 'forecaster',
    label: 'Forecaster',
    systemContext: 'You are providing financial forecasts. Project revenue, expenses, and cash runway based on historical data and trends.',
    quickSuggestions: [
      'Forecast next 3 months',
      'What\'s my cash runway?',
      'Revenue projection',
      'Expense trends',
    ],
  },
  '/journal': {
    mode: 'report_explainer',
    label: 'Journal Advisor',
    systemContext: 'You are helping with journal entries. Ensure debits equal credits, suggest proper account coding, and validate entries.',
    quickSuggestions: [
      'Create a journal entry',
      'Check for unbalanced entries',
      'Explain double-entry',
      'Suggest account codes',
    ],
  },
  '/settings': {
    mode: 'general',
    label: 'Settings Helper',
    systemContext: 'You are helping navigate system settings. Guide the user to the right configuration options.',
    quickSuggestions: [
      'How do I change my plan?',
      'Where are team settings?',
      'Export my data',
      'Configure notifications',
    ],
  },
};

// Default for pages not in the map
const DEFAULT_MODE: ModeConfig = {
  mode: 'financial_analyst',
  label: 'Financial Analyst',
  systemContext: 'You are a comprehensive financial intelligence assistant. Analyze data, answer questions, and help the user manage their business finances.',
  quickSuggestions: [
    'How is my business doing?',
    'Analyze my expenses',
    'Show risk areas',
    'Give me a growth strategy',
  ],
};

// ── Intent → Mode override ─────────────────────────────────────────────────

const INTENT_MODE_OVERRIDES: Array<{ patterns: RegExp[]; mode: AIMode }> = [
  {
    patterns: [/create\s*invoice/i, /invoice.*for/i, /bill\s+\w+/i],
    mode: 'action_executor',
  },
  {
    patterns: [/add\s*(new\s*)?employee/i, /hire/i, /new\s*staff/i],
    mode: 'action_executor',
  },
  {
    patterns: [/record\s*(expense|income|transaction)/i, /bought\s+/i, /paid\s+for/i, /spent\s+/i],
    mode: 'action_executor',
  },
  {
    patterns: [/generate\s*(a\s*)?(report|statement)/i],
    mode: 'action_executor',
  },
  {
    patterns: [/invite\s+/i, /add\s*(team|member|accountant|user)/i],
    mode: 'action_executor',
  },
  {
    patterns: [/forecast/i, /predict/i, /project/i, /runway/i, /burn\s*rate/i],
    mode: 'forecaster',
  },
  {
    patterns: [/coach/i, /advic?e/i, /strateg/i, /improv/i, /grow/i, /optimi[sz]/i],
    mode: 'business_coach',
  },
  {
    patterns: [/error/i, /duplicate/i, /missing/i, /unbalanced/i, /anomal/i, /wrong/i],
    mode: 'error_detector',
  },
  {
    patterns: [/categori[sz]/i, /classify/i, /what\s*type/i, /journal\s*entry/i],
    mode: 'expense_classifier',
  },
  {
    patterns: [/where|navigate|go\s*to|take\s*me|find|how\s*do\s*i\s*(find|access|open)/i],
    mode: 'navigator',
  },
];

/**
 * Determine the AI mode from the current page and message content.
 * Intent overrides take priority over page-based mode.
 */
export function detectMode(currentPage: string, message: string): AIMode {
  // 1. Check intent-based overrides first
  const lower = message.toLowerCase();
  for (const { patterns, mode } of INTENT_MODE_OVERRIDES) {
    if (patterns.some(p => p.test(lower))) {
      return mode;
    }
  }

  // 2. Fall back to page-based mode
  const normalized = currentPage.replace(/^\/+/, '/').split('?')[0];
  const config = PAGE_MODE_MAP[normalized];
  return config?.mode ?? DEFAULT_MODE.mode;
}

/**
 * Get the mode configuration for the current page.
 */
export function getModeConfig(currentPage: string): ModeConfig {
  const normalized = currentPage.replace(/^\/+/, '/').split('?')[0];
  return PAGE_MODE_MAP[normalized] ?? DEFAULT_MODE;
}

/**
 * Get the system context for the current mode + page combo.
 */
export function getModeSystemContext(currentPage: string, mode: AIMode): string {
  const pageConfig = getModeConfig(currentPage);

  // If mode was overridden by intent, provide a combined context
  if (pageConfig.mode !== mode) {
    const modeLabel = MODE_LABELS[mode] || mode;
    return `${pageConfig.systemContext}\n\nCurrently operating in ${modeLabel} mode based on the user's request.`;
  }

  return pageConfig.systemContext;
}

const MODE_LABELS: Record<AIMode, string> = {
  financial_analyst: 'Financial Analyst',
  report_explainer: 'Report Explainer',
  billing_assistant: 'Billing Assistant',
  payroll_advisor: 'Payroll Advisor',
  data_validator: 'Data Validator',
  business_coach: 'Business Coach',
  action_executor: 'Action Executor',
  expense_classifier: 'Expense Classifier',
  error_detector: 'Error Detector',
  forecaster: 'Forecaster',
  navigator: 'Navigator',
  general: 'General Assistant',
};

export function getModeLabel(mode: AIMode): string {
  return MODE_LABELS[mode] || 'General Assistant';
}
