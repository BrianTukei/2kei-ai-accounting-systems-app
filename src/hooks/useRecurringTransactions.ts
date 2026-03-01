
import { useState, useEffect } from 'react';
import { RecurringTransaction, RecurringTransactionFormData } from '@/types/RecurringTransaction';
import { Transaction } from '@/components/TransactionCard';
import { format, addDays, addWeeks, addMonths, addQuarters, addYears, parseISO } from 'date-fns';

const LOCAL_STORAGE_KEY = 'finance-app-recurring-transactions';

export const useRecurringTransactions = () => {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load recurring transactions from localStorage on initial render
  useEffect(() => {
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTransactions) {
      setRecurringTransactions(JSON.parse(storedTransactions));
    }
    setLoaded(true);
  }, []);

  // Save recurring transactions to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recurringTransactions));
    }
  }, [recurringTransactions, loaded]);

  // Get next date based on frequency and start date
  const getNextDate = (startDate: string, frequency: RecurringTransaction['frequency']): string => {
    const date = parseISO(startDate);
    
    switch (frequency) {
      case 'daily':
        return format(addDays(date, 1), 'yyyy-MM-dd');
      case 'weekly':
        return format(addWeeks(date, 1), 'yyyy-MM-dd');
      case 'monthly':
        return format(addMonths(date, 1), 'yyyy-MM-dd');
      case 'quarterly':
        return format(addQuarters(date, 1), 'yyyy-MM-dd');
      case 'yearly':
        return format(addYears(date, 1), 'yyyy-MM-dd');
      default:
        return startDate;
    }
  };

  // Add a new recurring transaction
  const addRecurringTransaction = (data: RecurringTransactionFormData) => {
    const id = Date.now().toString();
    const now = new Date();
    const nextDate = getNextDate(data.startDate, data.frequency);
    
    const newTransaction: RecurringTransaction = {
      id,
      ...data,
      nextDate,
      active: true,
      createdAt: format(now, 'yyyy-MM-dd')
    };
    
    setRecurringTransactions(prev => [newTransaction, ...prev]);
  };

  // Update a recurring transaction
  const updateRecurringTransaction = (transaction: RecurringTransaction) => {
    setRecurringTransactions(prev => 
      prev.map(t => t.id === transaction.id ? transaction : t)
    );
  };

  // Delete a recurring transaction
  const deleteRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Toggle active state
  const toggleActiveState = (id: string) => {
    setRecurringTransactions(prev => 
      prev.map(t => {
        if (t.id === id) {
          return { ...t, active: !t.active };
        }
        return t;
      })
    );
  };

  // Generates a regular transaction from a recurring transaction
  const generateTransaction = (recurringTransaction: RecurringTransaction): Omit<Transaction, 'id'> => {
    return {
      amount: recurringTransaction.amount,
      type: recurringTransaction.type,
      category: recurringTransaction.category,
      description: recurringTransaction.description,
      date: format(parseISO(recurringTransaction.nextDate), 'MMM dd, yyyy')
    };
  };

  // Process due recurring transactions and return generated transactions
  const processDueTransactions = (): Omit<Transaction, 'id'>[] => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const dueTransactions = recurringTransactions.filter(
      t => t.active && t.nextDate <= today
    );
    
    const generatedTransactions: Omit<Transaction, 'id'>[] = [];
    
    // Update next dates for due transactions
    if (dueTransactions.length > 0) {
      const updatedRecurringTransactions = recurringTransactions.map(t => {
        if (t.active && t.nextDate <= today) {
          const transaction = generateTransaction(t);
          generatedTransactions.push(transaction);
          
          return {
            ...t,
            nextDate: getNextDate(t.nextDate, t.frequency)
          };
        }
        return t;
      });
      
      setRecurringTransactions(updatedRecurringTransactions);
    }
    
    return generatedTransactions;
  };

  return {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleActiveState,
    processDueTransactions,
    generateTransaction
  };
};
