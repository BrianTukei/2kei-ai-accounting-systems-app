
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionCard, { Transaction } from '@/components/TransactionCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface TransactionsTabContentProps {
  transactions: Transaction[];
}

export default function TransactionsTabContent({ transactions }: TransactionsTabContentProps) {
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>View and manage your financial activity</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full">
          <Link to="/transactions">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <TransactionCard 
                key={transaction.id} 
                transaction={transaction} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">No transactions found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
