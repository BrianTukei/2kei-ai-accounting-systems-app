
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Transaction } from '@/components/TransactionCard';

interface TransactionSummaryProps {
  transactions: Transaction[];
}

export default function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-scale-in">
      <Card className="glass-card glass-card-hover">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-lg flex items-center">
            <ArrowUpRight className="h-5 w-5 mr-2 text-green-600" />
            Income
          </CardTitle>
          <div className="text-2xl font-bold text-green-600">
            +${totalIncome.toFixed(2)}
          </div>
        </CardHeader>
      </Card>
      
      <Card className="glass-card glass-card-hover">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-lg flex items-center">
            <ArrowDownLeft className="h-5 w-5 mr-2 text-red-600" />
            Expenses
          </CardTitle>
          <div className="text-2xl font-bold text-red-600">
            -${totalExpenses.toFixed(2)}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
