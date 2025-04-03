
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarClock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RecurringTransactionList from '@/components/transactions/RecurringTransactionList';
import RecurringTransactionModal from '@/components/RecurringTransactionModal';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { toast } from 'sonner';

export default function RecurringTransactions() {
  const { 
    recurringTransactions, 
    addRecurringTransaction, 
    updateRecurringTransaction, 
    deleteRecurringTransaction,
    toggleActiveState
  } = useRecurringTransactions();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const handleDeleteTransaction = (id: string) => {
    deleteRecurringTransaction(id);
    toast.success('Recurring transaction deleted');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in flex items-center">
              <CalendarClock className="mr-2 h-8 w-8" />
              Recurring Transactions
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Automate your regular income and expenses
            </p>
          </div>
          
          <Button 
            className="mt-4 md:mt-0 rounded-full animate-fade-in"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Recurring Transaction
          </Button>
        </div>
        
        <RecurringTransactionList 
          transactions={recurringTransactions}
          onUpdateTransaction={updateRecurringTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onToggleActive={toggleActiveState}
        />
      </main>
      
      <RecurringTransactionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRecurringTransaction={addRecurringTransaction}
      />
    </div>
  );
}
