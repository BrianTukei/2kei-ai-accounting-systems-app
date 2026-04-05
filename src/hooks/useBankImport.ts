/**
 * useBankImport.ts
 * ----------------
 * Handles the full bank-statement import wizard:
 *   Step 1 – file upload
 *   Step 2 – parsing (CSV / Excel / PDF / Images with OCR)
 *   Step 3 – AI categorisation
 *   Step 4 – review & edit
 *   Step 5 – post to transactions
 */

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { categoriseBatch, CategorisedRow } from '@/services/invoiceAI';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';

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

/**
 * Parse image (JPG, PNG) using Tesseract OCR
 * Extracts text from screenshot/image and attempts to parse as CSV
 */
async function parseImage(file: File): Promise<RawRow[]> {
  try {
    const reader = new FileReader();
    const imageData = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });

    // Use Tesseract to extract text from image
    const worker = await Tesseract.createWorker();
    const result = await worker.recognize(imageData);
    const extractedText = result.data.text;
    await worker.terminate();

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the image. Please ensure the image is clear and contains transaction data.');
    }

    // Try to parse the extracted text as CSV
    return new Promise((resolve, reject) => {
      Papa.parse<RawRow>(extractedText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('Could not parse extracted text as transactions. Please ensure the image contains table data.'));
          } else {
            resolve(results.data);
          }
        },
        error: (err) => reject(new Error(`Failed to parse OCR text: ${err.message}`)),
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Image processing failed';
    throw new Error(`OCR Error: ${msg}`);
  }
}

/**
 * Parse PDF using Tesseract OCR
 * Converts PDF to images and extracts text
 */
async function parsePDF(file: File): Promise<RawRow[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Dynamic import of PDF.js
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Extract text from first page (most bank statements are single page)
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF. Attempting OCR fallback...');
    }

    // Parse the extracted text as CSV
    return new Promise((resolve, reject) => {
      Papa.parse<RawRow>(fullText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('Could not parse PDF as transactions. Please ensure the PDF contains table data.'));
          } else {
            resolve(results.data);
          }
        },
        error: (err) => reject(new Error(`Failed to parse PDF text: ${err.message}`)),
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF processing failed';
    throw new Error(`PDF Error: ${msg}`);
  }
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

const LS_KEY = '2kai-bank-imports';

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
    setProgress(5);

    try {
      if (!file) throw new Error('No file selected');
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

      setProgress(40);

      // 1. Delegate parsing to the enterprise backend route
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobType', 'bank_statement_parse');

      let token = localStorage.getItem('supabase.auth.token') || '';
      if (!token) {
        const tokens = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (tokens.length) {
            const authObj = JSON.parse(localStorage.getItem(tokens[0]) || '{}');
            token = authObj.access_token || '';
        }
      }

      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

      const res = await fetch('/api/documents/parse-preview', {
        method: 'POST',
        headers,
        body: formData
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to parse document');
      }

      const backendRows = resData.rows || [];
      if (backendRows.length === 0) {
         throw new Error('No valid transaction rows found in file.');
      }

      setProgress(80);

      // 2. Map backend structure to the frontend Review Wizard expectations
      const mapped = backendRows.map((r: any) => {
         const debit = r.type === 'expense' ? Math.abs(r.amount) : 0;
         const credit = r.type === 'income' ? Math.abs(r.amount) : 0;

         return {
            date: r.date,
            description: String(r.description || ''),
            debit,
            credit,
            balance: null,
            aiCategory: r.category !== 'Uncategorized' ? r.category : undefined,
            aiType: r.type
         };
      });
      
      const categorised = categoriseBatch(mapped);
      
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
      
      // Delay step change to show 100% progress
      setTimeout(() => setStep('review'), 500);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to parse file. Please check the file format and try again.';
      setError(errorMsg);
      setStep('upload');
      setProgress(0);
      console.error('[BankImport] Processing error:', errorMsg, e);
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
