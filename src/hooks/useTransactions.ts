
import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/components/TransactionCard';
import { supabase } from '@/integrations/supabase/client';
import { autoCategory, generateJournalEntry, appendJournalEntry } from '@/services/bookkeeping';
import { exchangeService } from '@/services/exchangeService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import orgStorage, { STORAGE_KEYS } from '@/lib/orgStorage';

const BASE_CURRENCY = 'USD';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, authResolved } = useAuth();
  const { org, loading: organizationLoading } = useOrganization();

  // Each user only sees their own rows — never admin/global cache.
  useEffect(() => {
    if (!authResolved || organizationLoading) return;

    if (!user || !org) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const SUPABASE_ENABLED = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      if (SUPABASE_ENABLED) {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', org.id)
            .eq('user_id', user.id) // hard isolation
            .order('created_at', { ascending: false });

          if (!error && data && Array.isArray(data)) {
            const mapped = (data as any[]).map(
              (t) =>
                ({
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
                }) as Transaction
            );

            if (!cancelled) {
              setTransactions(mapped);
              // Cache only under this user + org
              orgStorage.setJSON(org.id, STORAGE_KEYS.TRANSACTIONS, mapped, user.id);
              setIsLoading(false);
            }
            return;
          }

          if (error) {
            console.error('Supabase transactions load:', error.message);
          }
        } catch (err) {
          console.error('Supabase load error:', err);
        }
      }

      // localStorage fallback — user-scoped (empty if this user never recorded)
      const stored = orgStorage.getJSON<Transaction[]>(
        org.id,
        STORAGE_KEYS.TRANSACTIONS,
        [],
        user.id
      );

      if (!cancelled) {
        setTransactions(Array.isArray(stored) ? stored : []);
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [authResolved, organizationLoading, user?.id, org?.id]);

  // Persist only this user's list
  useEffect(() => {
    if (isLoading) return;
    if (org?.id && user?.id) {
      orgStorage.setJSON(org.id, STORAGE_KEYS.TRANSACTIONS, transactions, user.id);
    }
  }, [transactions, isLoading, org?.id, user?.id]);

  const addTransaction = useCallback(
    async (newTransaction: Omit<Transaction, 'id'>) => {
      if (!user || !org) {
        throw new Error('Sign in and select an organization before recording data');
      }

      const enriched: Omit<Transaction, 'id'> = {
        ...newTransaction,
        category: newTransaction.category?.trim()
          ? newTransaction.category
          : autoCategory(newTransaction.description, newTransaction.type),
      };

      const txCurrency = (enriched.currency || BASE_CURRENCY).toUpperCase();
      const rate = exchangeService.getRateSync(txCurrency, BASE_CURRENCY);
      const baseCurrencyAmount = Math.round(enriched.amount * rate * 100) / 100;

      enriched.currency = txCurrency;
      enriched.original_amount = enriched.amount;
      enriched.original_currency = txCurrency;
      enriched.base_currency_amount = baseCurrencyAmount;
      enriched.exchange_rate_used = rate;
      enriched.exchange_rate_date = new Date().toISOString();

      const SUPABASE_ENABLED = Boolean(
        import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      if (SUPABASE_ENABLED) {
        const insertObj = {
          description: enriched.description,
          amount: enriched.amount,
          type: enriched.type,
          category: enriched.category,
          date: enriched.date,
          currency: enriched.currency,
          original_amount: enriched.original_amount,
          original_currency: enriched.original_currency,
          base_currency_amount: enriched.base_currency_amount,
          exchange_rate_used: enriched.exchange_rate_used,
          exchange_rate_date: enriched.exchange_rate_date,
          user_id: user.id,
          organization_id: org.id,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert(insertObj)
          .select();

        if (error) {
          const detail = error.message.includes('row-level security')
            ? 'Permission denied. Sign out and back in, or check RLS policies.'
            : error.message;
          throw new Error(`Transaction could not be saved: ${detail}`);
        }

        if (data && data.length > 0) {
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
            base_currency_amount:
              created.base_currency_amount ?? enriched.base_currency_amount,
            exchange_rate_used: created.exchange_rate_used ?? enriched.exchange_rate_used,
            exchange_rate_date: created.exchange_rate_date ?? enriched.exchange_rate_date,
            metadata: created.metadata ?? enriched.metadata,
          };

          setTransactions((prev) => [tx, ...prev]);
          appendJournalEntry(generateJournalEntry(tx, 'transaction'), org.id, user.id);
          return;
        }
      }

      const id = Date.now().toString();
      const transactionWithId: Transaction = { id, ...enriched };
      setTransactions((prev) => [transactionWithId, ...prev]);
      appendJournalEntry(
        generateJournalEntry(transactionWithId, 'transaction'),
        org.id,
        user.id
      );
    },
    [user, org]
  );

  const editTransaction = useCallback(
    async (updatedTransaction: Transaction) => {
      if (!user || !org) throw new Error('Sign in required');

      const SUPABASE_ENABLED = Boolean(
        import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      if (SUPABASE_ENABLED) {
        const { error } = await supabase
          .from('transactions')
          .update({
            amount: updatedTransaction.amount,
            type: updatedTransaction.type,
            category: updatedTransaction.category,
            description: updatedTransaction.description,
            date: updatedTransaction.date,
          })
          .eq('id', updatedTransaction.id)
          .eq('organization_id', org.id)
          .eq('user_id', user.id);

        if (error) throw new Error(`Could not update: ${error.message}`);
      }

      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );
    },
    [user, org]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user || !org) throw new Error('Sign in required');

      const SUPABASE_ENABLED = Boolean(
        import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      if (SUPABASE_ENABLED) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('organization_id', org.id)
          .eq('user_id', user.id);

        if (error) throw new Error(`Could not delete: ${error.message}`);
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [user, org]
  );

  return {
    transactions,
    isLoading,
    addTransaction,
    editTransaction,
    deleteTransaction,
  };
};
