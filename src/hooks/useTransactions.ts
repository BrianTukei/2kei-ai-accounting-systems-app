
import { useState, useEffect } from 'react';
import { Transaction } from '@/components/TransactionCard';
import { allTransactions } from '@/data/mockTransactions';

const LOCAL_STORAGE_KEY = 'finance-app-transactions';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from localStorage on initial render
  useEffect(() => {
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      // Only use mock data if nothing is in localStorage
      setTransactions(allTransactions);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTransactions));
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  const addTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const id = (Date.now()).toString(); // Use timestamp for unique IDs
    const transactionWithId: Transaction = {
      id,
      ...newTransaction
    };
    
    setTransactions(prevTransactions => [transactionWithId, ...prevTransactions]);
  };

  const editTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      )
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prevTransactions => 
      prevTransactions.filter(transaction => transaction.id !== id)
    );
  };

  return {
    transactions,
    addTransaction,
    editTransaction,
    deleteTransaction
  };
};
