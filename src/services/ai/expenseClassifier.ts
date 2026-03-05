/**
 * ai/expenseClassifier.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Smart Expense Classification — when user types natural expense text:
 *   "Bought fuel 200" → detects expense, categorizes, suggests journal entry.
 *
 * Uses rule-based classification with 30+ categories.
 * Returns structured data for both display and action execution.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { ExpenseClassification } from './types';
import { formatCurrency } from '@/lib/utils';

/** Currency-aware formatting */
function fmtCur(n: number): string {
  return formatCurrency(n);
}

// ── Category definitions ────────────────────────────────────────────────────

interface CategoryRule {
  category: string;
  accountCode: string;
  debitAccount: string;
  creditAccount: string;
  patterns: RegExp[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Transport & Fuel',
    accountCode: '6100',
    debitAccount: 'Transport Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/fuel/i, /petrol/i, /diesel/i, /transport/i, /taxi/i, /uber/i, /boda/i, /matatu/i, /bus\s*fare/i, /parking/i, /toll/i, /vehicle/i, /car\s*(?:wash|repair|service)/i],
  },
  {
    category: 'Office Supplies',
    accountCode: '6200',
    debitAccount: 'Office Supplies Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/office\s*suppli/i, /stationer/i, /paper/i, /printer/i, /ink/i, /toner/i, /pen/i, /folder/i, /envelope/i],
  },
  {
    category: 'Utilities',
    accountCode: '6300',
    debitAccount: 'Utilities Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/electric/i, /power/i, /water/i, /utility/i, /gas\s*bill/i, /umeme/i, /nwsc/i, /yaka/i],
  },
  {
    category: 'Rent',
    accountCode: '6400',
    debitAccount: 'Rent Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/rent/i, /lease/i, /office\s*space/i, /workspace/i],
  },
  {
    category: 'Salaries & Wages',
    accountCode: '6500',
    debitAccount: 'Salaries Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/salary|salaries/i, /wage/i, /payroll/i, /staff\s*pay/i, /employee\s*pay/i],
  },
  {
    category: 'Communication',
    accountCode: '6600',
    debitAccount: 'Communication Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/phone/i, /mobile/i, /airtime/i, /data\s*bundle/i, /internet/i, /wifi/i, /broadband/i, /telecom/i, /mtn/i, /airtel/i],
  },
  {
    category: 'Marketing & Advertising',
    accountCode: '6700',
    debitAccount: 'Marketing Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/marketing/i, /adverti/i, /promotion/i, /ads?\b/i, /campaign/i, /sponsor/i, /billboard/i, /flyer/i, /social\s*media\s*ad/i],
  },
  {
    category: 'Insurance',
    accountCode: '6800',
    debitAccount: 'Insurance Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/insurance/i, /premium/i, /cover(?:age)?/i, /policy/i],
  },
  {
    category: 'Professional Services',
    accountCode: '6900',
    debitAccount: 'Professional Fees',
    creditAccount: 'Cash / Bank',
    patterns: [/lawyer/i, /legal/i, /audit/i, /consultant/i, /professional/i, /accountant/i, /advisor/i, /training/i, /workshop/i, /seminar/i],
  },
  {
    category: 'Repairs & Maintenance',
    accountCode: '7000',
    debitAccount: 'Repairs & Maintenance',
    creditAccount: 'Cash / Bank',
    patterns: [/repair/i, /maintenance/i, /fix(?:ing)?/i, /servic(?:e|ing)/i, /plumb/i, /electri(?:cal|cian)/i],
  },
  {
    category: 'Food & Meals',
    accountCode: '7100',
    debitAccount: 'Meals & Entertainment',
    creditAccount: 'Cash / Bank',
    patterns: [/food/i, /lunch/i, /dinner/i, /breakfast/i, /meal/i, /cafe/i, /restaurant/i, /catering/i, /snack/i, /coffee/i, /tea\b/i],
  },
  {
    category: 'Travel & Accommodation',
    accountCode: '7200',
    debitAccount: 'Travel Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/travel/i, /hotel/i, /accommodation/i, /flight/i, /airfare/i, /airbnb/i, /lodg/i, /visa\s*fee/i],
  },
  {
    category: 'Bank Charges',
    accountCode: '7300',
    debitAccount: 'Bank Charges',
    creditAccount: 'Bank',
    patterns: [/bank\s*charge/i, /bank\s*fee/i, /transaction\s*fee/i, /atm/i, /withdrawal\s*fee/i, /overdraft/i, /service\s*charge/i],
  },
  {
    category: 'Taxes & Government',
    accountCode: '7400',
    debitAccount: 'Tax Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/tax/i, /vat/i, /ura\b/i, /license/i, /permit/i, /registration/i, /compliance/i, /government/i, /levy/i, /duty/i],
  },
  {
    category: 'Equipment & Assets',
    accountCode: '1500',
    debitAccount: 'Equipment (Asset)',
    creditAccount: 'Cash / Bank',
    patterns: [/equipment/i, /machine/i, /computer/i, /laptop/i, /phone\s*purchase/i, /furniture/i, /tool/i, /device/i, /hardware/i],
  },
  {
    category: 'Software & Subscriptions',
    accountCode: '7500',
    debitAccount: 'Software Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/software/i, /subscript/i, /saas/i, /license\s*(?:fee|renew)/i, /app\s*(?:fee|subscript)/i, /cloud/i, /hosting/i, /domain/i],
  },
  {
    category: 'Medical & Health',
    accountCode: '7600',
    debitAccount: 'Medical Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/medical/i, /health/i, /hospital/i, /clinic/i, /doctor/i, /pharmacy/i, /medicine/i, /drug/i],
  },
  {
    category: 'Donations & Charity',
    accountCode: '7700',
    debitAccount: 'Donations Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/donat/i, /charit/i, /tithe/i, /offering/i, /gift/i, /contribut/i],
  },
  {
    category: 'Cleaning & Sanitation',
    accountCode: '7800',
    debitAccount: 'Cleaning Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/clean/i, /sanit/i, /hygiene/i, /waste/i, /garbage/i, /trash/i, /janitor/i],
  },
  {
    category: 'Security',
    accountCode: '7900',
    debitAccount: 'Security Expense',
    creditAccount: 'Cash / Bank',
    patterns: [/security/i, /guard/i, /cctv/i, /alarm/i, /surveillance/i],
  },
];

// ── Classification ──────────────────────────────────────────────────────────

/**
 * Classify an expense from natural language input.
 */
export function classifyExpense(text: string, amount?: number): ExpenseClassification {
  const lower = text.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some(p => p.test(lower))) {
      return {
        category: rule.category,
        accountCode: rule.accountCode,
        type: 'expense',
        confidence: 0.85,
        suggestedJournalEntry: {
          debit: { account: rule.debitAccount, amount: amount || 0 },
          credit: { account: rule.creditAccount, amount: amount || 0 },
        },
        description: text.trim(),
      };
    }
  }

  // Default / uncategorized
  return {
    category: 'General Expense',
    accountCode: '6000',
    type: 'expense',
    confidence: 0.4,
    suggestedJournalEntry: {
      debit: { account: 'General Expense', amount: amount || 0 },
      credit: { account: 'Cash / Bank', amount: amount || 0 },
    },
    description: text.trim(),
  };
}

/**
 * Detect if a message is an expense entry.
 */
export function isExpenseEntry(message: string): boolean {
  return /\b(?:bought|purchased|paid\s+(?:for)?|spent|expense|cost)\b/i.test(message)
    && /\d/.test(message);
}

/**
 * Extract amount from text.
 */
export function extractAmount(text: string): number | null {
  const match = text.match(/\$?([\d,]+(?:\.\d{1,2})?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}

/**
 * Generate a classification response for the AI chat.
 */
export function generateClassificationResponse(text: string): string {
  const amount = extractAmount(text) || 0;
  const classification = classifyExpense(text, amount);

  let response = `## 🧾 Expense Classification\n\n`;
  response += `**Input:** "${text}"\n\n`;
  response += `• **Category:** ${classification.category}\n`;
  response += `• **Account Code:** ${classification.accountCode}\n`;
  response += `• **Type:** ${classification.type}\n`;
  response += `• **Confidence:** ${(classification.confidence * 100).toFixed(0)}%\n`;

  if (amount > 0) {
    response += `• **Amount:** ${fmtCur(amount)}\n\n`;
    response += `### Suggested Journal Entry\n`;
    response += `| | Account | Amount |\n`;
    response += `|---|---------|-------:|\n`;
    response += `| **DR** | ${classification.suggestedJournalEntry.debit.account} | ${fmtCur(amount)} |\n`;
    response += `| **CR** | ${classification.suggestedJournalEntry.credit.account} | ${fmtCur(amount)} |\n\n`;
  }

  response += `Would you like me to **record this expense** automatically?`;

  return response;
}
