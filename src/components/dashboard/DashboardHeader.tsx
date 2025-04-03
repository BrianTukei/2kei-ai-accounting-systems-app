
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddTransactionModal from '@/components/AddTransactionModal';
import RecurringTransactionModal from '@/components/RecurringTransactionModal';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const { addTransaction } = useTransactions();
  const { addRecurringTransaction } = useRecurringTransactions();

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    addTransaction(transaction);
    toast.success(`New ${transaction.type} added successfully`);
  };

  const handleAddRecurringTransaction = (transaction: any) => {
    addRecurringTransaction(transaction);
    toast.success(`New recurring ${transaction.type} added successfully`);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
          {title}
        </h1>
        <p className="text-slate-500 animate-fade-in">
          {subtitle}
        </p>
      </div>
      
      <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2 animate-fade-in">
        <Button 
          variant="outline"
          className="rounded-full"
          onClick={() => setIsRecurringModalOpen(true)}
        >
          <Repeat className="h-4 w-4 mr-2" />
          Add Recurring
        </Button>
        <Button 
          className="rounded-full"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </div>

      <AddTransactionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      <RecurringTransactionModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onAddRecurringTransaction={handleAddRecurringTransaction}
      />
    </div>
  );
}
