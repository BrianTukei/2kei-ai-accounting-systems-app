
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Pencil, Trash2, Clock, Repeat } from 'lucide-react';
import { RecurringTransaction } from '@/types/RecurringTransaction';
import { format, parseISO } from 'date-fns';
import RecurringTransactionModal from '../RecurringTransactionModal';
import { cn } from '@/lib/utils';

interface RecurringTransactionListProps {
  transactions: RecurringTransaction[];
  onUpdateTransaction: (transaction: RecurringTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export default function RecurringTransactionList({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onToggleActive
}: RecurringTransactionListProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | undefined>();

  const handleEdit = (transaction: RecurringTransaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const frequencyLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly'
  };

  return (
    <>
      <Card className="glass-card glass-card-hover animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Repeat className="w-5 h-5 mr-2" />
            Recurring Transactions
          </CardTitle>
          <CardDescription>
            Manage your automatically repeating transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    transaction.active 
                      ? "border-slate-200 hover:border-slate-300" 
                      : "border-slate-200 bg-slate-50 opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        transaction.type === 'income' 
                          ? "bg-green-100 text-green-600" 
                          : "bg-red-100 text-red-600"
                      )}>
                        <Clock className="h-5 w-5" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm">{transaction.category}</h3>
                        <p className="text-xs text-muted-foreground">{transaction.description}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                            {frequencyLabels[transaction.frequency]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Next: {format(parseISO(transaction.nextDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-2">
                        <p className={cn(
                          "font-semibold",
                          transaction.type === 'income' ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                      
                      <Toggle 
                        pressed={transaction.active}
                        onPressedChange={() => onToggleActive(transaction.id)}
                        aria-label="Toggle active status"
                        className={cn(
                          "data-[state=on]:bg-green-100 data-[state=on]:text-green-600",
                          "data-[state=off]:bg-slate-100 data-[state=off]:text-slate-600"
                        )}
                      >
                        {transaction.active ? 'Active' : 'Paused'}
                      </Toggle>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTransaction(transaction.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No recurring transactions set up.</p>
              <p className="text-sm text-slate-400 mt-1">
                Create a recurring transaction to automate your regular income and expenses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {editModalOpen && (
        <RecurringTransactionModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedTransaction(undefined);
          }}
          onAddRecurringTransaction={() => {}}
          onUpdateRecurringTransaction={onUpdateTransaction}
          transactionToEdit={selectedTransaction}
        />
      )}
    </>
  );
}
