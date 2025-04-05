
import { useState } from 'react';
import StatCard from '@/components/StatCard';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function StatsGrid() {
  const [totalBalance, setTotalBalance] = useState('');
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [pending, setPending] = useState('');
  const [incomeTrend, setIncomeTrend] = useState('');
  const [expensesTrend, setExpensesTrend] = useState('');

  // Function to handle value changes and ensure proper formatting
  const handleValueChange = (value: string, setter: (value: string) => void) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      parts.pop();
    }
    setter(parts.join('.'));
  };

  // Function to handle trend changes
  const handleTrendChange = (value: string, setter: (value: string) => void) => {
    // Remove any non-numeric characters except minus sign
    const sanitized = value.replace(/[^0-9-]/g, '');
    // Ensure only one minus sign at the beginning
    if (sanitized.startsWith('-')) {
      const withoutMinus = sanitized.substring(1).replace(/-/g, '');
      setter(`-${withoutMinus}`);
    } else {
      setter(sanitized.replace(/-/g, ''));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Total Balance" 
        description="Enter your balance"
        icon={DollarSign}
        iconClassName="bg-blue-100 text-blue-600"
        customContent={
          <div className="mt-2">
            <div className="flex items-center">
              <span className="text-lg mr-1">$</span>
              <Input
                value={totalBalance}
                onChange={(e) => handleValueChange(e.target.value, setTotalBalance)}
                className="h-8 text-2xl font-bold p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="0.00"
              />
            </div>
          </div>
        }
      />
      <StatCard 
        title="Income" 
        description="This month"
        icon={ArrowUpRight}
        iconClassName="bg-green-100 text-green-600"
        customContent={
          <div className="space-y-1 mt-2">
            <div className="flex items-center">
              <span className="text-lg mr-1">$</span>
              <Input
                value={income}
                onChange={(e) => handleValueChange(e.target.value, setIncome)}
                className="h-8 text-2xl font-bold p-0 border-none text-green-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center">
              <Input
                value={incomeTrend}
                onChange={(e) => handleTrendChange(e.target.value, setIncomeTrend)}
                className="h-6 w-12 text-xs p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="0"
              />
              <span className="text-xs ml-1">% change</span>
            </div>
          </div>
        }
      />
      <StatCard 
        title="Expenses" 
        description="This month"
        icon={ArrowDownLeft}
        iconClassName="bg-red-100 text-red-600"
        customContent={
          <div className="space-y-1 mt-2">
            <div className="flex items-center">
              <span className="text-lg mr-1">$</span>
              <Input
                value={expenses}
                onChange={(e) => handleValueChange(e.target.value, setExpenses)}
                className="h-8 text-2xl font-bold p-0 border-none text-red-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center">
              <Input
                value={expensesTrend}
                onChange={(e) => handleTrendChange(e.target.value, setExpensesTrend)}
                className="h-6 w-12 text-xs p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="0"
              />
              <span className="text-xs ml-1">% change</span>
            </div>
          </div>
        }
      />
      <StatCard 
        title="Pending" 
        description="In transit"
        icon={CreditCard}
        iconClassName="bg-amber-100 text-amber-600"
        customContent={
          <div className="mt-2">
            <div className="flex items-center">
              <span className="text-lg mr-1">$</span>
              <Input
                value={pending}
                onChange={(e) => handleValueChange(e.target.value, setPending)}
                className="h-8 text-2xl font-bold p-0 border-none text-amber-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="0.00"
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
