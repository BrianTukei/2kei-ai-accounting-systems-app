/**
 * useInvoices.ts
 * --------------
 * Manages invoice CRUD with localStorage persistence and optional Supabase sync.
 * Matches the same pattern used by useTransactions.ts.
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;   // ISO date string
  dueDate: string;     // ISO date string
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes: string;
  currency: string;
  paidAt?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceInput = Omit<Invoice, 'id' | 'invoiceNumber' | 'subtotal' | 'taxAmount' | 'total' | 'createdAt' | 'updatedAt'>;

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const LS_KEY = 'ledgerly-invoices';
const COUNTER_KEY = 'ledgerly-invoice-counter';

function getNextInvoiceNumber(): string {
  const raw = localStorage.getItem(COUNTER_KEY);
  const n   = raw ? parseInt(raw) + 1 : 100;
  localStorage.setItem(COUNTER_KEY, String(n));
  return `INV-${String(n).padStart(4, '0')}`;
}

function computeTotals(items: InvoiceItem[], taxRate: number, discount: number) {
  const subtotal  = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total     = Math.max(0, subtotal + taxAmount - discount);
  return { subtotal, taxAmount, total };
}

function now() { return new Date().toISOString(); }

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useInvoices() {
  const [invoices, setInvoices_]  = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* persist helper */
  const persist = useCallback((list: Invoice[]) => {
    setInvoices_(list);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }, []);

  /* load */
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try { setInvoices_(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  /* auto-mark overdue */
  useEffect(() => {
    if (isLoading) return;
    const today = new Date().toISOString().split('T')[0];
    let dirty = false;
    const updated = invoices.map((inv) => {
      if (inv.status === 'sent' && inv.dueDate < today) {
        dirty = true;
        return { ...inv, status: 'overdue' as InvoiceStatus, updatedAt: now() };
      }
      return inv;
    });
    if (dirty) persist(updated);
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  /* CREATE */
  const createInvoice = useCallback((input: InvoiceInput): Invoice => {
    const { subtotal, taxAmount, total } = computeTotals(input.items, input.taxRate, input.discount);
    const invoice: Invoice = {
      ...input,
      id:            uuidv4(),
      invoiceNumber: getNextInvoiceNumber(),
      subtotal,
      taxAmount,
      total,
      createdAt:     now(),
      updatedAt:     now(),
    };
    persist([invoice, ...invoices]);
    return invoice;
  }, [invoices, persist]);

  /* UPDATE */
  const updateInvoice = useCallback((id: string, changes: Partial<InvoiceInput>): void => {
    const updated = invoices.map((inv) => {
      if (inv.id !== id) return inv;
      const merged = { ...inv, ...changes };
      const { subtotal, taxAmount, total } = computeTotals(
        merged.items, merged.taxRate, merged.discount
      );
      return { ...merged, subtotal, taxAmount, total, updatedAt: now() };
    });
    persist(updated);
  }, [invoices, persist]);

  /* DELETE */
  const deleteInvoice = useCallback((id: string): void => {
    persist(invoices.filter((inv) => inv.id !== id));
  }, [invoices, persist]);

  /* MARK PAID */
  const markPaid = useCallback((id: string, method?: string): void => {
    const updated = invoices.map((inv) =>
      inv.id === id
        ? { ...inv, status: 'paid' as InvoiceStatus, paidAt: now(), paymentMethod: method ?? 'Manual', updatedAt: now() }
        : inv
    );
    persist(updated);
  }, [invoices, persist]);

  /* MARK SENT */
  const markSent = useCallback((id: string): void => {
    const updated = invoices.map((inv) =>
      inv.id === id
        ? { ...inv, status: 'sent' as InvoiceStatus, updatedAt: now() }
        : inv
    );
    persist(updated);
  }, [invoices, persist]);

  /* STATS */
  const stats = {
    total:       invoices.length,
    outstanding: invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0),
    paid:        invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    overdue:     invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0),
    countOverdue: invoices.filter((i) => i.status === 'overdue').length,
  };

  return {
    invoices,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markPaid,
    markSent,
    stats,
  };
}
