
import StatCard from '@/components/StatCard';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <StatCard 
          title="Total Balance" 
          value="$12,580.00" 
          description="Updated just now" 
          icon={DollarSign}
          iconClassName="bg-primary/10 text-primary border border-primary/20"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <StatCard 
          title="Income" 
          value="$8,320.00" 
          description="This month" 
          trend={12}
          icon={ArrowUpRight}
          iconClassName="bg-success/10 text-success border border-success/20"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
        <StatCard 
          title="Expenses" 
          value="$3,250.00" 
          description="This month" 
          trend={-8}
          icon={ArrowDownLeft}
          iconClassName="bg-destructive/10 text-destructive border border-destructive/20"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
        <StatCard 
          title="Pending" 
          value="$1,750.00" 
          description="In transit" 
          icon={CreditCard}
          iconClassName="bg-warning/10 text-warning border border-warning/20"
        />
      </div>
    </div>
  );
}
