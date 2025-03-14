
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AddTransactionModal from '@/components/AddTransactionModal';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addTransaction } = useTransactions();

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    addTransaction(transaction);
    toast.success(`New ${transaction.type} added successfully`);
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
      
      <div className="mt-4 md:mt-0 flex space-x-2 animate-fade-in">
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
    </div>
  );
}
