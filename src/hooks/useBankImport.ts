/**
 * useBankImport.ts
 * ----------------
 * Handles the full bank-statement import wizard:
 *   Step 1 – file upload
 *   Step 2 – parsing (CSV / Excel)
 *   Step 3 – AI categorisation
 *   Step 4 – review & edit
 *   Step 5 – post to transactions
 */

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { categoriseBatch, CategorisedRow } from '@/services/invoiceAI';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type ImportStep = 'upload' | 'processing' | 'review' | 'posting' | 'done';

export interface ImportedRow extends CategorisedRow {
  id: string;
  confirmed: boolean;
}

export interface ImportSession {
  id: string;
  fileName: string;
  fileType: string;
  totalRows: number;
  rows: ImportedRow[];
  createdAt: string;
}

// ─────────────────────────────────────────
// Column name aliases (normalise headers)
// ─────────────────────────────────────────

const DATE_ALIASES    = ['date', 'transaction date', 'txn date', 'value date', 'posting date'];
const DESC_ALIASES    = ['description', 'details', 'narration', 'particulars', 'memo', 'reference'];
const DEBIT_ALIASES   = ['debit', 'debit amount', 'withdrawal', 'dr', 'amount out'];
const CREDIT_ALIASES  = ['credit', 'credit amount', 'deposit', 'cr', 'amount in'];
const BALANCE_ALIASES = ['balance', 'running balance', 'closing balance', 'ledger balance'];

function findCol(headers: string[], aliases: string[]): string | undefined {
  return headers.find((h) => aliases.includes(h.toLowerCase().trim()));
}

function parseNum(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (!v) return 0;
  const s = String(v).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function normaliseDate(v: unknown): string {
  if (!v) return new Date().toISOString().split('T')[0];
  const s = String(v).trim();
  // Try direct ISO parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const year  = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

// ─────────────────────────────────────────
// Parsers
// ─────────────────────────────────────────

type RawRow = Record<string, unknown>;

function mapRows(raw: RawRow[]): Array<{ date:string; description:string; debit:number; credit:number; balance:number|null }> {
  if (!raw.length) return [];
  const headers = Object.keys(raw[0]).map((h) => h.toLowerCase().trim());

  const dateCol    = findCol(headers, DATE_ALIASES);
  const descCol    = findCol(headers, DESC_ALIASES);
  const debitCol   = findCol(headers, DEBIT_ALIASES);
  const creditCol  = findCol(headers, CREDIT_ALIASES);
  const balanceCol = findCol(headers, BALANCE_ALIASES);

  // Fallback: if no debit/credit, try "amount" column
  const amountAliases = ['amount', 'amount (zar)', 'transaction amount'];
  const amountCol  = findCol(headers, amountAliases);

  return raw
    .filter((r) => {
      // Skip rows with no description or date
      const d = descCol ? String(r[descCol] ?? r[Object.keys(r).find(k=>k.toLowerCase().trim()===descCol)!] ?? '') : '';
      return d.trim().length > 0;
    })
    .map((r) => {
      // Find value by normalized key
      const get = (key?: string) => {
        if (!key) return undefined;
        const actualKey = Object.keys(r).find((k)=>k.toLowerCase().trim()===key);
        return actualKey ? r[actualKey] : undefined;
      };

      const rawDate  = dateCol    ? get(dateCol)    : Object.values(r)[0];
      const rawDesc  = descCol    ? get(descCol)    : Object.values(r)[1] ?? '';
      const rawDebit = debitCol   ? get(debitCol)   : undefined;
      const rawCredit= creditCol  ? get(creditCol)  : undefined;
      const rawBal   = balanceCol ? get(balanceCol) : undefined;
      const rawAmt   = amountCol  ? get(amountCol)  : undefined;

      let debit  = parseNum(rawDebit);
      let credit = parseNum(rawCredit);

      // If we have a single "amount" column, negative = debit, positive = credit
      if (!debitCol && !creditCol && rawAmt !== undefined) {
        const amt = parseNum(rawAmt);
        if (amt < 0) debit  = Math.abs(amt);
        else         credit = amt;
      }

      return {
        date:        normaliseDate(rawDate),
        description: String(rawDesc).trim(),
        debit,
        credit,
        balance:     rawBal !== undefined ? parseNum(rawBal) : null,
      };
    });
}

async function parseCSV(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

async function parseExcel(file: File): Promise<RawRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const headers: string[] = [];
  ws.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '');
  });

  const rows: RawRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header row
    const obj: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const key = headers[colNumber - 1];
      if (key) obj[key] = cell.value instanceof Date ? cell.value : (cell.value ?? '');
    });
    rows.push(obj as RawRow);
  });
  return rows;
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

const LS_KEY = 'ledgerly-bank-imports';

export function useBankImport() {
  const [step,       setStep]       = useState<ImportStep>('upload');
  const [progress,   setProgress]   = useState(0);
  const [session,    setSession]    = useState<ImportSession | null>(null);
  const [rows,       setRows]       = useState<ImportedRow[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [sessions,   setSessions]   = useState<ImportSession[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
  });

  const persistSessions = (list: ImportSession[]) => {
    setSessions(list);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  };

  /* UPLOAD & PARSE */
  const processFile = useCallback(async (file: File) => {
    setError(null);
    setStep('processing');
    setProgress(10);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      let raw: RawRow[] = [];

      if (ext === 'csv') {
        raw = await parseCSV(file);
      } else if (['xlsx','xls','ods'].includes(ext)) {
        raw = await parseExcel(file);
      } else if (ext === 'pdf') {
        // PDF: guide user to convert to CSV
        throw new Error('PDF import: please export your bank statement as CSV or Excel for automatic parsing. PDF text extraction is not supported in the browser.');
      } else {
        throw new Error(`Unsupported file type: .${ext}. Please upload a CSV or Excel file.`);
      }

      setProgress(40);

      const mapped = mapRows(raw);
      setProgress(60);

      const categorised = categoriseBatch(mapped);
      setProgress(80);

      const importedRows: ImportedRow[] = categorised.map((r) => ({
        ...r,
        id:        uuidv4(),
        confirmed: !r.isDuplicate,
      }));

      const newSession: ImportSession = {
        id:        uuidv4(),
        fileName:  file.name,
        fileType:  ext,
        totalRows: importedRows.length,
        rows:      importedRows,
        createdAt: new Date().toISOString(),
      };

      setSession(newSession);
      setRows(importedRows);
      setProgress(100);
      setStep('review');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse file.');
      setStep('upload');
    }
  }, []);

  /* ROW EDIT */
  const updateRow = useCallback((id: string, changes: Partial<ImportedRow>) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...changes } : r));
  }, []);

  /* TOGGLE CONFIRM */
  const toggleConfirm = useCallback((id: string) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, confirmed: !r.confirmed } : r));
  }, []);

  /* CONFIRM ALL */
  const confirmAll = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, confirmed: true })));
  }, []);

  /* POST — converts confirmed rows to Transaction format and saves */
  const postTransactions = useCallback((
    addTransaction: (t: { amount: number; type: 'income'|'expense'; category: string; description: string; date: string }) => void
  ) => {
    setStep('posting');
    const confirmed = rows.filter((r) => r.confirmed);
    confirmed.forEach((r) => {
      const amount = r.aiType === 'expense' ? r.debit  : r.credit;
      addTransaction({
        amount,
        type:        r.aiType,
        category:    r.aiCategory,
        description: r.description,
        date:        r.date,
      });
    });

    if (session) {
      const saved = { ...session, rows };
      persistSessions([saved, ...sessions.filter((s) => s.id !== session.id)]);
    }

    setStep('done');
  }, [rows, session, sessions]);

  /* RESET */
  const reset = useCallback(() => {
    setStep('upload');
    setProgress(0);
    setSession(null);
    setRows([]);
    setError(null);
  }, []);

  return {
    step, progress, session, rows, error,
    sessions,
    processFile, updateRow, toggleConfirm, confirmAll, postTransactions, reset,
  };
}
