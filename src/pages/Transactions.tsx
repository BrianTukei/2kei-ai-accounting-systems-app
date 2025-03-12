
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Transaction } from '@/components/TransactionCard';
import AddTransactionModal from '@/components/AddTransactionModal';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import TransactionList from '@/components/transactions/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';

export default function Transactions() {
  const { transactions, addTransaction, editTransaction } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  };

  const handleFilter = (value: string) => {
    setFilterType(value);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setTransactionToEdit(undefined);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.category.toLowerCase().includes(searchQuery) ||
      transaction.description.toLowerCase().includes(searchQuery);
    
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

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
        
        <TransactionSummary transactions={filteredTransactions} />
        
        <TransactionList 
          transactions={filteredTransactions}
          onEditTransaction={handleEditTransaction}
        />
      </main>
      
      <AddTransactionModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAddTransaction={addTransaction}
        onEditTransaction={editTransaction}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
}
