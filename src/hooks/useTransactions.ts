
import { useState, useEffect } from 'react';
import { Transaction } from '@/components/TransactionCard';
import { allTransactions } from '@/data/mockTransactions';
import { supabase } from '@/integrations/supabase/client';
import { autoCategory, generateJournalEntry, appendJournalEntry } from '@/services/bookkeeping';
import { exchangeService } from '@/services/exchangeService';

const LOCAL_STORAGE_KEY = 'finance-app-transactions';
const BASE_CURRENCY = 'USD';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from Supabase (if configured) or localStorage on initial render
  useEffect(() => {
    const SUPABASE_ENABLED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

    const load = async () => {
      if (SUPABASE_ENABLED) {
        try {
          const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
          if (!error && data && Array.isArray(data) && data.length > 0) {
            const mapped = (data as any[]).map((t) => ({
              id: t.id ?? String(Date.now()),
              amount: t.amount ?? 0,
              type: t.type ?? 'expense',
              category: t.category ?? '',
              description: t.description ?? '',
              date: t.date ?? new Date().toLocaleDateString(),
              currency: t.currency ?? 'USD',
              original_amount: t.original_amount ?? t.amount ?? 0,
              original_currency: t.original_currency ?? t.currency ?? 'USD',
              base_currency_amount: t.base_currency_amount ?? t.amount ?? 0,
              exchange_rate_used: t.exchange_rate_used ?? 1,
              exchange_rate_date: t.exchange_rate_date ?? undefined,
              metadata: t.metadata ?? undefined,
            } as Transaction));

            setTransactions(mapped);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          // Fall back to localStorage on error
          console.error('Supabase load error:', err);
        }
      }

      // localStorage fallback
      const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        setTransactions(allTransactions);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTransactions));
      }

      setIsLoading(false);
    };

    load();
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    // Auto-categorise if category is blank
    const enriched: Omit<Transaction, 'id'> = {
      ...newTransaction,
      category: newTransaction.category?.trim()
        ? newTransaction.category
        : autoCategory(newTransaction.description, newTransaction.type),
    };

    // Determine transaction currency and compute base-currency (USD) amount
    const txCurrency = (enriched.currency || BASE_CURRENCY).toUpperCase();
    const rate = exchangeService.getRateSync(txCurrency, BASE_CURRENCY);
    const baseCurrencyAmount = Math.round(enriched.amount * rate * 100) / 100;

    // Attach multi-currency fields
    enriched.currency = txCurrency;
    enriched.original_amount = enriched.amount;
    enriched.original_currency = txCurrency;
    enriched.base_currency_amount = baseCurrencyAmount;
    enriched.exchange_rate_used = rate;
    enriched.exchange_rate_date = new Date().toISOString();

    const SUPABASE_ENABLED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

    if (SUPABASE_ENABLED) {
      try {
        const insertObj: any = {
          ...enriched,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('transactions').insert(insertObj).select();
        if (!error && data && data.length > 0) {
          const created = data[0] as any;
          const tx: Transaction = {
            id: created.id ?? String(Date.now()),
            amount: created.amount ?? enriched.amount,
            type: created.type ?? enriched.type,
            category: created.category ?? enriched.category,
            description: created.description ?? enriched.description,
            date: created.date ?? enriched.date,
            currency: created.currency ?? enriched.currency,
            original_amount: created.original_amount ?? enriched.original_amount,
            original_currency: created.original_currency ?? enriched.original_currency,
            base_currency_amount: created.base_currency_amount ?? enriched.base_currency_amount,
            exchange_rate_used: created.exchange_rate_used ?? enriched.exchange_rate_used,
            exchange_rate_date: created.exchange_rate_date ?? enriched.exchange_rate_date,
            metadata: created.metadata ?? enriched.metadata,
          };

          setTransactions(prev => [tx, ...prev]);
          // Auto-post to journal ledger
          appendJournalEntry(generateJournalEntry(tx, 'transaction'));
          return;
        }
      } catch (err) {
        console.error('Supabase insert error:', err);
      }
    }

    // local fallback
    const id = (Date.now()).toString();
    const transactionWithId: Transaction = { id, ...enriched };

    setTransactions(prevTransactions => [transactionWithId, ...prevTransactions]);
    // Auto-post to journal ledger
    appendJournalEntry(generateJournalEntry(transactionWithId, 'transaction'));
  };

  const editTransaction = async (updatedTransaction: Transaction) => {
    const SUPABASE_ENABLED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

    if (SUPABASE_ENABLED) {
      try {
        const { data, error } = await supabase.from('transactions').update(updatedTransaction).eq('id', updatedTransaction.id).select();
        if (!error) {
          setTransactions(prevTransactions => 
            prevTransactions.map(transaction => 
              transaction.id === updatedTransaction.id ? updatedTransaction : transaction
            )
          );
          return;
        }
      } catch (err) {
        console.error('Supabase update error:', err);
      }
    }

    // local fallback
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      )
    );
  };

  const deleteTransaction = async (id: string) => {
    const SUPABASE_ENABLED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

    if (SUPABASE_ENABLED) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) {
          setTransactions(prevTransactions => 
            prevTransactions.filter(transaction => transaction.id !== id)
          );
          return;
        }
      } catch (err) {
        console.error('Supabase delete error:', err);
      }
    }

    // local fallback
    setTransactions(prevTransactions => 
      prevTransactions.filter(transaction => transaction.id !== id)
    );
  };

  return {
    transactions,
    isLoading,
    addTransaction,
    editTransaction,
    deleteTransaction
  };
};
