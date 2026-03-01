
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarClock } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
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
    <PageLayout 
      title="Recurring Transactions" 
      subtitle="Automate your regular income and expenses"
      showSidebar={false}
    >
      <div className="flex items-center justify-end mb-8">    
        <Button 
          className="rounded-full animate-fade-in"
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
      
      <RecurringTransactionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRecurringTransaction={addRecurringTransaction}
      />
    </PageLayout>
  );
}
