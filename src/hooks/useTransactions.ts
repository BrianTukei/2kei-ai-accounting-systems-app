
import { useState } from 'react';
import { Transaction } from '@/components/TransactionCard';
import { allTransactions } from '@/data/mockTransactions';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(allTransactions);

  const addTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const id = (transactions.length + 1).toString();
    const transactionWithId: Transaction = {
      id,
      ...newTransaction
    };
    
    setTransactions([transactionWithId, ...transactions]);
  };

  const editTransaction = (updatedTransaction: Transaction) => {
    setTransactions(transactions.map(transaction => 
      transaction.id === updatedTransaction.id ? updatedTransaction : transaction
    ));
  };

  return {
    transactions,
    addTransaction,
    editTransaction
  };
};
