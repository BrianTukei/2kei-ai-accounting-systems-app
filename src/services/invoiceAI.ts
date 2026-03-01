/**
 * invoiceAI.ts
 * -----------
 * Rule-based AI services for:
 *  1. Parsing natural-language invoice instructions
 *  2. Categorising bank-statement transactions
 *  3. Building payment-reminder email copy
 *
 * All logic is client-side (no external API call required) so it works
 * even without a configured Supabase / Edge Function.
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface ParsedInvoice {
  clientName: string;
  amount: number;
  description: string;
  dueDays: number;
  currency: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceFormData {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  taxRate: number;
  discount: number;
  notes: string;
  currency: string;
}

export interface CategorisedRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number | null;
  aiCategory: string;
  aiType: 'income' | 'expense';
  isDuplicate: boolean;
}

// ─────────────────────────────────────────
// 1. Natural-language → Invoice
// ─────────────────────────────────────────

/**
 * Parses a plain-English invoice instruction such as
 *   "Invoice John for Website Design $800 due in 7 days"
 */
export function parseInvoiceInstruction(instruction: string): Partial<InvoiceFormData> {
  const raw = instruction.trim();

  // --- Extract client name: "Invoice <Name> for …" or "Bill <Name> …"
  let clientName = '';
  const clientMatch =
    raw.match(/(?:invoice|bill|charge)\s+([A-Za-z][A-Za-z\s'-]+?)\s+(?:for|about|\$)/i) ??
    raw.match(/(?:invoice|bill|charge)\s+([A-Za-z][A-Za-z\s'-]+)/i);
  if (clientMatch) clientName = clientMatch[1].trim();

  // --- Extract description: "for <desc>"
  let description = '';
  const descMatch = raw.match(/for\s+([^$\d]+?)(?:\$|at\s+\$|\s+\d|due|$)/i);
  if (descMatch) description = descMatch[1].trim().replace(/\s+$/, '');

  // --- Extract amount: $800, 800, USD 800
  let amount = 0;
  const amountMatch = raw.match(/(?:\$|USD\s*|EUR\s*|GBP\s*)?(\d[\d,]*(?:\.\d{1,2})?)/);
  if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ''));

  // --- Extract currency
  let currency = 'USD';
  const currencyMap: Record<string, string> = {
    '$': 'USD', usd: 'USD', eur: 'EUR', '€': 'EUR',
    gbp: 'GBP', '£': 'GBP', zar: 'ZAR', r: 'ZAR',
  };
  for (const [sym, code] of Object.entries(currencyMap)) {
    if (raw.toLowerCase().includes(sym)) { currency = code; break; }
  }

  // --- Extract due days: "due in 7 days" / "due 30 days" / "net 30"
  let dueDays = 14;
  const dueMatch =
    raw.match(/due\s+in\s+(\d+)\s+day/i) ??
    raw.match(/due\s+(\d+)\s+day/i) ??
    raw.match(/net\s*(\d+)/i) ??
    raw.match(/(\d+)\s*day/i);
  if (dueMatch) dueDays = parseInt(dueMatch[1]);

  // Build dates
  const today = new Date();
  const issueDate = today.toISOString().split('T')[0];
  const dueDate = new Date(today.getTime() + dueDays * 86_400_000)
    .toISOString().split('T')[0];

  // Build item
  const items: InvoiceItem[] = amount > 0
    ? [{ id: uuidv4(), description: description || 'Service', quantity: 1, unitPrice: amount, total: amount }]
    : [];

  return {
    clientName,
    clientEmail: '',
    clientAddress: '',
    issueDate,
    dueDate,
    items,
    taxRate: 0,
    discount: 0,
    notes: '',
    currency,
  };
}

// ─────────────────────────────────────────
// 2. Bank-statement row categorisation
// ─────────────────────────────────────────

interface CategoryRule {
  pattern: RegExp;
  category: string;
  type: 'income' | 'expense';
}

const CATEGORY_RULES: CategoryRule[] = [
  // Income patterns
  { pattern: /salary|payroll|wages?|stipend/i,              category: 'Salary Income',        type: 'income' },
  { pattern: /transfer\s+from|deposit|credit\s+from/i,      category: 'Bank Transfer',        type: 'income' },
  { pattern: /invoice|payment\s+received|client\s+pay/i,    category: 'Client Payment',       type: 'income' },
  { pattern: /interest\s+earned|interest\s+credit/i,        category: 'Interest Income',      type: 'income' },
  { pattern: /refund|reversal/i,                            category: 'Refund',               type: 'income' },
  { pattern: /dividend/i,                                   category: 'Dividend Income',      type: 'income' },

  // Expense patterns
  { pattern: /fuel|petrol|diesel|shell|total\s+energ|chevron|caltex/i, category: 'Transport Expense',  type: 'expense' },
  { pattern: /uber|taxi|grab|lyft|bolt/i,                   category: 'Transport Expense',    type: 'expense' },
  { pattern: /mtn|vodacom|airtel|telkom|safaricom|airtime|data\s+bundle|wifi|internet/i, category: 'Utilities', type: 'expense' },
  { pattern: /electricity|eskom|water\s+bill|municipal|rates\s+and\s+taxes/i, category: 'Utilities',   type: 'expense' },
  { pattern: /rent|lease|landlord/i,                        category: 'Rent & Lease',         type: 'expense' },
  { pattern: /groceries?|checkers|woolworths|pick\s+n\s+pay|shoprite|spar|food|market/i, category: 'Groceries', type: 'expense' },
  { pattern: /restaurant|kfc|mcdonalds|burger|pizza|takeaway|coffee|cafe|starbucks/i, category: 'Meals & Entertainment', type: 'expense' },
  { pattern: /insurance|assurance|premium/i,                category: 'Insurance',            type: 'expense' },
  { pattern: /bank\s+fee|monthly\s+fee|service\s+fee|admin\s+fee|charge|commission/i, category: 'Bank Charges', type: 'expense' },
  { pattern: /loan|instalment|repayment|bond|mortgage/i,    category: 'Loan Repayment',       type: 'expense' },
  { pattern: /supplier|vendor|purchase|payment\s+to/i,      category: 'Supplier Payment',      type: 'expense' },
  { pattern: /salary|wages?\s+paid|payroll\s+run/i,         category: 'Salaries & Wages',     type: 'expense' },
  { pattern: /tax|sars|revenue\s+service|vat\s+payment/i,   category: 'Tax Payment',           type: 'expense' },
  { pattern: /stationery|office|amazon|takealot/i,          category: 'Office Supplies',      type: 'expense' },
  { pattern: /medical|hospital|pharmacy|doctor|clinic|health/i, category: 'Medical Expenses', type: 'expense' },
  { pattern: /airfare|flight|airline|hotel|accommodation|booking/i, category: 'Travel',        type: 'expense' },
  { pattern: /software|subscription|saas|adobe|microsoft|google|netflix|spotify/i, category: 'Subscriptions', type: 'expense' },
  { pattern: /atm|cash\s+withdrawal|withdrawal/i,            category: 'Cash Withdrawal',      type: 'expense' },
];

/**
 * Categorise a single bank-statement row.
 * Uses the debit/credit amount to disambiguate income vs. expense when
 * the rule-based match is uncertain.
 */
export function categoriseTransaction(
  description: string,
  debit: number,
  credit: number,
): { category: string; type: 'income' | 'expense' } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, type: rule.type };
    }
  }

  // Fallback: infer from debit/credit amounts
  if (credit > 0 && debit === 0) return { category: 'Miscellaneous Income',  type: 'income'  };
  if (debit  > 0 && credit === 0) return { category: 'Miscellaneous Expense', type: 'expense' };
  return { category: 'Uncategorised', type: 'expense' };
}

/**
 * Batch-categorise an array of raw parsed rows.
 * Also flags duplicates (same date + description + amounts).
 */
export function categoriseBatch(
  rows: Array<{ date: string; description: string; debit: number; credit: number; balance?: number | null }>
): CategorisedRow[] {
  const seen = new Set<string>();

  return rows.map((row) => {
    const debit  = row.debit  ?? 0;
    const credit = row.credit ?? 0;
    const key    = `${row.date}|${row.description.trim().toLowerCase()}|${debit}|${credit}`;
    const isDuplicate = seen.has(key);
    seen.add(key);

    const { category, type } = categoriseTransaction(row.description, debit, credit);

    return {
      date:        row.date,
      description: row.description,
      debit,
      credit,
      balance:     row.balance ?? null,
      aiCategory:  category,
      aiType:      type,
      isDuplicate,
    };
  });
}

// ─────────────────────────────────────────
// 3. Payment reminder email copy
// ─────────────────────────────────────────

export type ReminderTiming = 'before' | 'due' | 'overdue';

export function buildReminderEmail(params: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  timing: ReminderTiming;
}): { subject: string; body: string } {
  const { clientName, invoiceNumber, amount, currency, dueDate, timing } = params;
  const fmt = new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);

  if (timing === 'before') {
    return {
      subject: `Friendly Reminder: Invoice ${invoiceNumber} is due tomorrow`,
      body: `Hi ${clientName},\n\nThis is a friendly reminder that Invoice ${invoiceNumber} for ${fmt} is due on ${dueDate}.\n\nPlease arrange payment at your earliest convenience.\n\nThank you for your business!`,
    };
  }
  if (timing === 'due') {
    return {
      subject: `Invoice ${invoiceNumber} — Payment Due Today`,
      body: `Hi ${clientName},\n\nInvoice ${invoiceNumber} for ${fmt} is due today (${dueDate}).\n\nKindly process payment to avoid a late fee.\n\nThank you!`,
    };
  }
  return {
    subject: `OVERDUE: Invoice ${invoiceNumber} — Action Required`,
    body: `Hi ${clientName},\n\nInvoice ${invoiceNumber} for ${fmt} was due on ${dueDate} and remains unpaid.\n\nPlease settle this balance immediately to avoid further escalation.\n\nIf you have any questions, reply to this email.\n\nBest regards`,
  };
}
