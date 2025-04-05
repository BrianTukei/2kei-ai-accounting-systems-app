
import StatCard from '@/components/StatCard';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Total Balance" 
        value="$12,580.00" 
        description="Updated just now" 
        icon={DollarSign}
        iconClassName="bg-blue-100 text-blue-600"
      />
      <StatCard 
        title="Income" 
        value="$8,320.00" 
        description="This month" 
        trend={12}
        icon={ArrowUpRight}
        iconClassName="bg-green-100 text-green-600"
      />
      <StatCard 
        title="Expenses" 
        value="$3,250.00" 
        description="This month" 
        trend={-8}
        icon={ArrowDownLeft}
        iconClassName="bg-red-100 text-red-600"
      />
      <StatCard 
        title="Pending" 
        value="$1,750.00" 
        description="In transit" 
        icon={CreditCard}
        iconClassName="bg-amber-100 text-amber-600"
      />
    </div>
  );
}
