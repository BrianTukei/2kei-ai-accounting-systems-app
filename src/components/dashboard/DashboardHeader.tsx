
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
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold tracking-tight text-shadow gradient-text">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            {subtitle}
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline"
            className="modern-card-hover border-primary/20 hover:border-primary/40 backdrop-blur-sm"
            onClick={() => setIsRecurringModalOpen(true)}
          >
            <Repeat className="h-4 w-4 mr-2" />
            Add Recurring
          </Button>
          <Button 
            className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
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
    </>
  );
}
