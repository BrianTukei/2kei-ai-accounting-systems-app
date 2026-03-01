/**
 * bookkeeping.ts
 * ──────────────
 * Core automated bookkeeping engine.
 *
 * Responsibilities:
 *  1. Chart of Accounts — canonical account map used for double-entry
 *  2. Auto-categorisation — map a transaction description + type to an account
 *  3. Double-entry journal — generate debit/credit pairs for every transaction
 *  4. Journal persistence — localStorage CRUD for journal entries
 *  5. Trial balance snapshot — sum all accounts for T-account view
 */

import { v4 as uuidv4 } from 'uuid';
import { categoriseTransaction } from './invoiceAI';
import { Transaction } from '@/components/TransactionCard';
import { Invoice } from '@/hooks/useInvoices';

// ─────────────────────────────────────────
// 1. Chart of Accounts
// ─────────────────────────────────────────

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  code: string;       // e.g. "1010"
  name: string;
  type: AccountType;
  normalBalance: 'debit' | 'credit'; // debit for assets/expenses, credit for liabilities/equity/income
}

export const CHART_OF_ACCOUNTS: Account[] = [
  // Assets (1xxx)
  { code: '1010', name: 'Cash & Bank',            type: 'asset',     normalBalance: 'debit'  },
  { code: '1020', name: 'Accounts Receivable',    type: 'asset',     normalBalance: 'debit'  },
  { code: '1030', name: 'Inventory',               type: 'asset',     normalBalance: 'debit'  },
  { code: '1040', name: 'Prepaid Expenses',        type: 'asset',     normalBalance: 'debit'  },
  { code: '1050', name: 'Other Current Assets',    type: 'asset',     normalBalance: 'debit'  },
  { code: '1100', name: 'Fixed Assets',            type: 'asset',     normalBalance: 'debit'  },

  // Liabilities (2xxx)
  { code: '2010', name: 'Accounts Payable',        type: 'liability', normalBalance: 'credit' },
  { code: '2020', name: 'Tax Payable',             type: 'liability', normalBalance: 'credit' },
  { code: '2030', name: 'Loan Payable',            type: 'liability', normalBalance: 'credit' },
  { code: '2040', name: 'Salaries Payable',        type: 'liability', normalBalance: 'credit' },
  { code: '2050', name: 'Other Current Liabilities', type: 'liability', normalBalance: 'credit' },

  // Equity (3xxx)
  { code: '3010', name: "Owner's Equity",          type: 'equity',    normalBalance: 'credit' },
  { code: '3020', name: 'Retained Earnings',       type: 'equity',    normalBalance: 'credit' },
  { code: '3030', name: 'Drawings',                type: 'equity',    normalBalance: 'debit'  },

  // Income (4xxx)
  { code: '4010', name: 'Sales Revenue',           type: 'income',    normalBalance: 'credit' },
  { code: '4020', name: 'Service Revenue',         type: 'income',    normalBalance: 'credit' },
  { code: '4030', name: 'Interest Income',         type: 'income',    normalBalance: 'credit' },
  { code: '4040', name: 'Other Income',            type: 'income',    normalBalance: 'credit' },

  // Expenses (5xxx)
  { code: '5010', name: 'Cost of Goods Sold',      type: 'expense',   normalBalance: 'debit'  },
  { code: '5020', name: 'Salaries & Wages',        type: 'expense',   normalBalance: 'debit'  },
  { code: '5030', name: 'Rent & Lease',            type: 'expense',   normalBalance: 'debit'  },
  { code: '5040', name: 'Utilities',               type: 'expense',   normalBalance: 'debit'  },
  { code: '5050', name: 'Transport Expense',       type: 'expense',   normalBalance: 'debit'  },
  { code: '5060', name: 'Meals & Entertainment',   type: 'expense',   normalBalance: 'debit'  },
  { code: '5070', name: 'Insurance',               type: 'expense',   normalBalance: 'debit'  },
  { code: '5080', name: 'Bank Charges',            type: 'expense',   normalBalance: 'debit'  },
  { code: '5090', name: 'Tax Payment',             type: 'expense',   normalBalance: 'debit'  },
  { code: '5100', name: 'Subscriptions',           type: 'expense',   normalBalance: 'debit'  },
  { code: '5110', name: 'Office Supplies',         type: 'expense',   normalBalance: 'debit'  },
  { code: '5120', name: 'Medical Expenses',        type: 'expense',   normalBalance: 'debit'  },
  { code: '5130', name: 'Travel',                  type: 'expense',   normalBalance: 'debit'  },
  { code: '5140', name: 'Loan Repayment',          type: 'expense',   normalBalance: 'debit'  },
  { code: '5150', name: 'Miscellaneous Expense',   type: 'expense',   normalBalance: 'debit'  },
  { code: '5160', name: 'Groceries',               type: 'expense',   normalBalance: 'debit'  },
  { code: '5170', name: 'Supplier Payment',        type: 'expense',   normalBalance: 'debit'  },
  { code: '5180', name: 'Cash Withdrawal',         type: 'expense',   normalBalance: 'debit'  },
];

// ─────────────────────────────────────────
// 2. Category → Account mapping
// ─────────────────────────────────────────

const CATEGORY_TO_ACCOUNT: Record<string, string> = {
  // Income categories → revenue accounts
  'Salary Income':        '4020',
  'Client Payment':       '4020',
  'Bank Transfer':        '1010',
  'Interest Income':      '4030',
  'Refund':               '4040',
  'Dividend Income':      '4040',
  'Miscellaneous Income': '4040',

  // Expense categories → expense accounts
  'Transport Expense':    '5050',
  'Utilities':            '5040',
  'Rent & Lease':         '5030',
  'Groceries':            '5160',
  'Meals & Entertainment': '5060',
  'Insurance':            '5070',
  'Bank Charges':         '5080',
  'Loan Repayment':       '5140',
  'Supplier Payment':     '5170',
  'Salaries & Wages':     '5020',
  'Tax Payment':          '5090',
  'Office Supplies':      '5110',
  'Medical Expenses':     '5120',
  'Travel':               '5130',
  'Subscriptions':        '5100',
  'Cash Withdrawal':      '5180',
  'Miscellaneous Expense': '5150',
  'Uncategorised':        '5150',
};

export function getAccountForCategory(category: string, type: 'income' | 'expense'): string {
  return CATEGORY_TO_ACCOUNT[category] ?? (type === 'income' ? '4040' : '5150');
}

/** Auto-categorise a transaction description using the same AI rules as bank import */
export function autoCategory(description: string, type: 'income' | 'expense'): string {
  const debit  = type === 'expense' ? 1 : 0;
  const credit = type === 'income'  ? 1 : 0;
  return categoriseTransaction(description, debit, credit).category;
}

// ─────────────────────────────────────────
// 3. Double-entry journal types
// ─────────────────────────────────────────

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit:  number;
  credit: number;
}

export interface JournalEntry {
  id:           string;
  date:         string;
  description:  string;
  reference:    string;   // e.g. transaction id, invoice number
  source:       'transaction' | 'invoice' | 'bank-import' | 'payroll' | 'recurring' | 'manual';
  lines:        JournalLine[];
  createdAt:    string;
}

// ─────────────────────────────────────────
// 4. Generate journal entry from a transaction
// ─────────────────────────────────────────

/**
 * Every transaction generates TWO journal lines (double-entry):
 *
 * INCOME:
 *   DR  1010  Cash & Bank           (asset increases)
 *   CR  4xxx  Revenue account       (income increases)
 *
 * EXPENSE:
 *   DR  5xxx  Expense account       (expense increases)
 *   CR  1010  Cash & Bank           (asset decreases)
 */
export function generateJournalEntry(
  tx: Transaction,
  source: JournalEntry['source'] = 'transaction',
): JournalEntry {
  const category = tx.category || autoCategory(tx.description, tx.type);
  const expenseOrIncomeCode = getAccountForCategory(category, tx.type);
  const cashAccount = CHART_OF_ACCOUNTS.find((a) => a.code === '1010')!;
  const otherAccount = CHART_OF_ACCOUNTS.find((a) => a.code === expenseOrIncomeCode)
    ?? CHART_OF_ACCOUNTS.find((a) => a.code === '5150')!;

  const lines: JournalLine[] =
    tx.type === 'income'
      ? [
          { accountCode: '1010', accountName: cashAccount.name, debit: tx.amount, credit: 0 },
          { accountCode: otherAccount.code, accountName: otherAccount.name, debit: 0, credit: tx.amount },
        ]
      : [
          { accountCode: otherAccount.code, accountName: otherAccount.name, debit: tx.amount, credit: 0 },
          { accountCode: '1010', accountName: cashAccount.name, debit: 0, credit: tx.amount },
        ];

  return {
    id:          uuidv4(),
    date:        tx.date,
    description: tx.description,
    reference:   tx.id,
    source,
    lines,
    createdAt:   new Date().toISOString(),
  };
}

// ─────────────────────────────────────────
// 5. Journal persistence
// ─────────────────────────────────────────

const LS_KEY = 'ledgerly-journal';

export function loadJournal(): JournalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveJournal(entries: JournalEntry[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

/** Append a single entry only if a matching reference doesn't already exist */
export function appendJournalEntry(entry: JournalEntry): void {
  const existing = loadJournal();
  if (existing.some((e) => e.reference === entry.reference && e.source === entry.source)) return;
  saveJournal([entry, ...existing]);
}

/** Rebuild the entire journal from the transactions array (idempotent) */
export function syncJournalFromTransactions(transactions: Transaction[]): void {
  const existing = loadJournal();
  const existingRefs = new Set(
    existing.filter((e) => e.source === 'transaction').map((e) => e.reference)
  );
  const newEntries: JournalEntry[] = [];
  for (const tx of transactions) {
    if (!existingRefs.has(tx.id)) {
      newEntries.push(generateJournalEntry(tx, 'transaction'));
    }
  }
  if (newEntries.length > 0) {
    saveJournal([...newEntries, ...existing]);
  }
}

// ─────────────────────────────────────────
// 5b. Full resync — rebuild from ALL sources
// ─────────────────────────────────────────

/** Shape of a stored bank-import session (subset we need) */
interface StoredImportRow {
  id: string;
  confirmed: boolean;
  date: string;
  description: string;
  debit: number;
  credit: number;
  aiCategory: string;
  aiType: 'income' | 'expense';
}

/** Generate a journal entry for a paid invoice (DR Cash / CR Service Revenue) */
function generateInvoiceJournalEntry(invoice: Invoice): JournalEntry {
  const cashAcc    = CHART_OF_ACCOUNTS.find((a) => a.code === '1010')!;
  const revenueAcc = CHART_OF_ACCOUNTS.find((a) => a.code === '4020')!;
  return {
    id:          uuidv4(),
    date:        (invoice.paidAt ?? invoice.updatedAt).split('T')[0],
    description: `Invoice ${invoice.invoiceNumber} — ${invoice.clientName}`,
    reference:   invoice.id,
    source:      'invoice',
    lines: [
      { accountCode: '1010',          accountName: cashAcc.name,    debit: invoice.total, credit: 0 },
      { accountCode: revenueAcc.code, accountName: revenueAcc.name, debit: 0, credit: invoice.total },
    ],
    createdAt: new Date().toISOString(),
  };
}

/** Generate journal entries from all confirmed bank-import rows */
function generateBankImportEntries(): JournalEntry[] {
  let sessions: Array<{ rows: StoredImportRow[] }> = [];
  try {
    sessions = JSON.parse(localStorage.getItem('ledgerly-bank-imports') ?? '[]');
  } catch { /* empty store */ }

  const entries: JournalEntry[] = [];
  for (const session of sessions) {
    for (const row of session.rows) {
      if (!row.confirmed) continue;
      const amount = row.aiType === 'income' ? (row.credit || row.debit) : (row.debit || row.credit);
      if (!amount) continue;

      const expCode  = getAccountForCategory(row.aiCategory, row.aiType);
      const cashAcc  = CHART_OF_ACCOUNTS.find((a) => a.code === '1010')!;
      const otherAcc = CHART_OF_ACCOUNTS.find((a) => a.code === expCode)
                    ?? CHART_OF_ACCOUNTS.find((a) => a.code === '5150')!;

      const lines: JournalLine[] =
        row.aiType === 'income'
          ? [
              { accountCode: '1010',         accountName: cashAcc.name,   debit: amount, credit: 0 },
              { accountCode: otherAcc.code,  accountName: otherAcc.name,  debit: 0, credit: amount },
            ]
          : [
              { accountCode: otherAcc.code,  accountName: otherAcc.name,  debit: amount, credit: 0 },
              { accountCode: '1010',         accountName: cashAcc.name,   debit: 0, credit: amount },
            ];

      entries.push({
        id:          uuidv4(),
        date:        row.date,
        description: row.description,
        reference:   row.id,
        source:      'bank-import',
        lines,
        createdAt:   new Date().toISOString(),
      });
    }
  }
  return entries;
}

export interface ResyncResult {
  transactions: number;
  invoices:     number;
  bankImports:  number;
  /** How many stale auto-generated entries were replaced */
  removed:      number;
}

/**
 * Full journal rebuild — clears every auto-generated entry (all sources except
 * 'manual') and regenerates fresh entries from transactions, paid invoices, and
 * confirmed bank-import rows.  Manual entries are always preserved.
 */
export function fullResync(transactions: Transaction[], invoices: Invoice[]): ResyncResult {
  const existing = loadJournal();

  // Preserve only hand-crafted manual entries
  const manual  = existing.filter((e) => e.source === 'manual');
  const removed = existing.length - manual.length;

  // Re-generate from every automated source
  const txEntries   = transactions.map((tx) => generateJournalEntry(tx, 'transaction'));
  const invEntries  = invoices.filter((inv) => inv.status === 'paid').map(generateInvoiceJournalEntry);
  const bankEntries = generateBankImportEntries();

  saveJournal([...txEntries, ...invEntries, ...bankEntries, ...manual]);

  return {
    transactions: txEntries.length,
    invoices:     invEntries.length,
    bankImports:  bankEntries.length,
    removed,
  };
}

// ─────────────────────────────────────────
// 6. Trial balance computation
// ─────────────────────────────────────────

export interface TrialBalanceLine {
  code:   string;
  name:   string;
  type:   AccountType;
  debit:  number;
  credit: number;
  balance: number; // signed — positive means normal-balance direction
}

export function computeTrialBalance(entries: JournalEntry[]): TrialBalanceLine[] {
  const totals: Record<string, { debit: number; credit: number }> = {};

  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!totals[line.accountCode]) totals[line.accountCode] = { debit: 0, credit: 0 };
      totals[line.accountCode].debit  += line.debit;
      totals[line.accountCode].credit += line.credit;
    }
  }

  return CHART_OF_ACCOUNTS.filter((a) => totals[a.code])
    .map((a) => {
      const { debit, credit } = totals[a.code];
      const balance = a.normalBalance === 'debit' ? debit - credit : credit - debit;
      return { code: a.code, name: a.name, type: a.type, debit, credit, balance };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}
