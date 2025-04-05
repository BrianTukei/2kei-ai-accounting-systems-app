
import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, Edit2, Check } from 'lucide-react';
import { Transaction } from '@/components/TransactionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TransactionSummaryProps {
  transactions: Transaction[];
}

export default function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const initialIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const initialExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const [totalIncome, setTotalIncome] = useState(initialIncome || 0);
  const [totalExpenses, setTotalExpenses] = useState(initialExpenses || 0);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [isEditingExpenses, setIsEditingExpenses] = useState(false);
  const [incomeValue, setIncomeValue] = useState(totalIncome.toString());
  const [expensesValue, setExpensesValue] = useState(totalExpenses.toString());

  const handleSaveIncome = () => {
    setTotalIncome(parseFloat(incomeValue) || 0);
    setIsEditingIncome(false);
  };

  const handleSaveExpenses = () => {
    setTotalExpenses(parseFloat(expensesValue) || 0);
    setIsEditingExpenses(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-scale-in">
      <Card className="glass-card glass-card-hover">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-lg flex items-center">
            <ArrowUpRight className="h-5 w-5 mr-2 text-green-600" />
            Income
          </CardTitle>
          {isEditingIncome ? (
            <div className="flex items-center">
              <Input
                type="number"
                value={incomeValue}
                onChange={(e) => setIncomeValue(e.target.value)}
                className="w-32 mr-2 h-8"
              />
              <Button size="icon" variant="ghost" onClick={handleSaveIncome}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="text-2xl font-bold text-green-600 mr-2">
                +${totalIncome.toFixed(2)}
              </div>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingIncome(true)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>
      
      <Card className="glass-card glass-card-hover">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-lg flex items-center">
            <ArrowDownLeft className="h-5 w-5 mr-2 text-red-600" />
            Expenses
          </CardTitle>
          {isEditingExpenses ? (
            <div className="flex items-center">
              <Input
                type="number"
                value={expensesValue}
                onChange={(e) => setExpensesValue(e.target.value)}
                className="w-32 mr-2 h-8"
              />
              <Button size="icon" variant="ghost" onClick={handleSaveExpenses}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="text-2xl font-bold text-red-600 mr-2">
                -${totalExpenses.toFixed(2)}
              </div>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingExpenses(true)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}
