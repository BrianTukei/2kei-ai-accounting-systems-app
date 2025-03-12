
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Transaction } from '@/components/TransactionCard';
import AddTransactionModal from '@/components/AddTransactionModal';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import TransactionList from '@/components/transactions/TransactionList';
import { allTransactions } from '@/data/mockTransactions';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(allTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      handleFilter(filterType);
      return;
    }
    
    const filtered = allTransactions.filter(
      transaction =>
        transaction.category.toLowerCase().includes(query) ||
        transaction.description.toLowerCase().includes(query)
    );
    
    setTransactions(filtered);
  };

  const handleFilter = (value: string) => {
    setFilterType(value);
    
    if (value === 'all') {
      setTransactions(
        searchQuery
          ? allTransactions.filter(
              t =>
                t.category.toLowerCase().includes(searchQuery) ||
                t.description.toLowerCase().includes(searchQuery)
            )
          : allTransactions
      );
    } else {
      const filtered = allTransactions.filter(
        t =>
          t.type === value &&
          (!searchQuery ||
            t.category.toLowerCase().includes(searchQuery) ||
            t.description.toLowerCase().includes(searchQuery))
      );
      setTransactions(filtered);
    }
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const id = (transactions.length + 1).toString();
    
    const transactionWithId: Transaction = {
      id,
      ...newTransaction
    };
    
    const updatedTransactions = [transactionWithId, ...transactions];
    setTransactions(updatedTransactions);
    
    allTransactions.unshift(transactionWithId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Transactions
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Manage your income and expenses
            </p>
          </div>
          
          <Button 
            className="mt-4 md:mt-0 rounded-full animate-fade-in"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
        
        <TransactionFilters 
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          filterType={filterType}
          onFilterChange={handleFilter}
        />
        
        <TransactionSummary transactions={transactions} />
        
        <TransactionList transactions={transactions} />
      </main>
      
      <AddTransactionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}
