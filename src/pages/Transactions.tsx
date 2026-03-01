
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Transaction } from '@/components/TransactionCard';
import AddTransactionModal from '@/components/AddTransactionModal';
import ReceiptScanner from '@/components/receipt/ReceiptScanner';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import TransactionList from '@/components/transactions/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

export default function Transactions() {
  const { transactions, addTransaction, editTransaction, deleteTransaction } = useTransactions();
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

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    toast.success('Transaction deleted successfully');
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setTransactionToEdit(undefined);
  };

  const handleReceiptScan = (data: any) => {
    addTransaction({
      amount: data.amount,
      type: 'expense',
      category: data.category,
      description: data.description,
      date: data.date
    });
    toast.success('Receipt scanned and transaction added!');
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.category.toLowerCase().includes(searchQuery) ||
      transaction.description.toLowerCase().includes(searchQuery);
    
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <PageLayout 
      title="Transactions" 
      subtitle="Manage your income and expenses"
    >
          <div className="flex flex-col md:flex-row md:items-center justify-end mb-10 animate-fade-up">
            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
              <ReceiptScanner onScanComplete={handleReceiptScan} />
              <Button 
                className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </div>
          </div>
          
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <TransactionFilters 
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              filterType={filterType}
              onFilterChange={handleFilter}
            />
          </div>
          
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <TransactionSummary transactions={filteredTransactions} />
          </div>
          
          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <TransactionList 
              transactions={filteredTransactions}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        
        <AddTransactionModal 
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          onAddTransaction={addTransaction}
          onEditTransaction={editTransaction}
          transactionToEdit={transactionToEdit}
        />
    </PageLayout>
  );
}
