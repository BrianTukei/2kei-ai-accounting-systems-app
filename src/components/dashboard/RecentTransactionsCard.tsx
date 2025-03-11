
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import TransactionCard, { Transaction } from '@/components/TransactionCard';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
}

export default function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
  return (
    <Card className="glass-card glass-card-hover lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full">
          <Link to="/transactions">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 4).map((transaction) => (
            <TransactionCard 
              key={transaction.id} 
              transaction={transaction} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
