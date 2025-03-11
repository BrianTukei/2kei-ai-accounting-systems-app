
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionCard, { Transaction } from '@/components/TransactionCard';

interface TransactionsTabContentProps {
  transactions: Transaction[];
}

export default function TransactionsTabContent({ transactions }: TransactionsTabContentProps) {
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
        <CardDescription>View and manage your financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
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
