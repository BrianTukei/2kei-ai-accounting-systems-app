
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Transaction } from '@/components/TransactionCard';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TransactionSummaryProps {
  transactions: Transaction[];
}

export default function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const { convertAmount, formatCurrency, selectedCurrency } = useCurrency();

  const getOriginalAmount = (transaction: Transaction) => (
    transaction.original_amount ?? transaction.originalAmount ?? transaction.amount
  );

  const getOriginalCurrency = (transaction: Transaction) => (
    transaction.original_currency ?? transaction.originalCurrency ?? transaction.currency ?? 'USD'
  );
  
  // Convert each transaction before summing so mixed-currency totals are meaningful.
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + convertAmount(getOriginalAmount(t), getOriginalCurrency(t)), 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + convertAmount(getOriginalAmount(t), getOriginalCurrency(t)), 0);

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-in">
        <Card className="glass-card glass-card-hover">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <CardTitle className="text-lg flex items-center">
              <ArrowUpRight className="h-5 w-5 mr-2 text-green-600" />
              Income
            </CardTitle>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(totalIncome)}
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
              -{formatCurrency(totalExpenses)}
            </div>
          </CardHeader>
        </Card>
      </div>

    </div>
  );
}
