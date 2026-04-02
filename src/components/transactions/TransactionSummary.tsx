
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Transaction } from '@/components/TransactionCard';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TransactionSummaryProps {
  transactions: Transaction[];
}

export default function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const { formatCurrency } = useCurrency();
  
  // Calculate in original currencies
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate in converted currency (USD)
  const totalIncomeConverted = transactions
    .filter(t => t.type === 'income' && t.convertedAmount !== undefined)
    .reduce((sum, t) => sum + (t.convertedAmount || 0), 0);
    
  const totalExpensesConverted = transactions
    .filter(t => t.type === 'expense' && t.convertedAmount !== undefined)
    .reduce((sum, t) => sum + (t.convertedAmount || 0), 0);

  // Check if we have forex data
  const hasForexData = totalIncomeConverted > 0 || totalExpensesConverted > 0;

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

      {/* Forex Summary */}
      {hasForexData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-in">
          <Card className="glass-card glass-card-hover bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Income (USD)
              </CardTitle>
              <div className="text-2xl font-bold text-blue-600">
                +{formatCurrency(totalIncomeConverted, 'USD')}
              </div>
            </CardHeader>
          </Card>
          
          <Card className="glass-card glass-card-hover bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Expenses (USD)
              </CardTitle>
              <div className="text-2xl font-bold text-blue-600">
                -{formatCurrency(totalExpensesConverted, 'USD')}
              </div>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
