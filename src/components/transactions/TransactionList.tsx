
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionCard, { Transaction } from '@/components/TransactionCard';
import { RefreshCw } from 'lucide-react';
import { useForexTransactions } from '@/hooks/useForexTransactions';
import { useState, useEffect } from 'react';

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  showForexRates?: boolean;
  targetCurrency?: string;
}

export default function TransactionList({ 
  transactions, 
  onEditTransaction,
  onDeleteTransaction,
  showForexRates = true,
  targetCurrency = 'USD'
}: TransactionListProps) {
  const { updateTransactionsBatch, loading } = useForexTransactions();
  const [transactionsWithForex, setTransactionsWithForex] = useState<Transaction[]>(transactions);

  // Update transactions with forex rates on mount and when transactions change
  useEffect(() => {
    if (showForexRates && transactions.length > 0) {
      updateTransactionsBatch(transactions, targetCurrency).then(updated => {
        setTransactionsWithForex(updated);
      });
    } else {
      setTransactionsWithForex(transactions);
    }
  }, [transactions, targetCurrency, showForexRates, updateTransactionsBatch]);

  const handleRefreshRates = async () => {
    if (transactionsWithForex.length > 0) {
      const updated = await updateTransactionsBatch(transactionsWithForex, targetCurrency);
      setTransactionsWithForex(updated);
    }
  };

  return (
    <Card className="glass-card glass-card-hover animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {transactionsWithForex.length} transaction{transactionsWithForex.length !== 1 ? 's' : ''}
            {showForexRates && ` • Rates in ${targetCurrency}`}
          </CardDescription>
        </div>
        {showForexRates && transactionsWithForex.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRates}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Updating' : 'Refresh Rates'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {transactionsWithForex.length > 0 ? (
          <div className="space-y-3">
            {transactionsWithForex.map((transaction) => (
              <TransactionCard 
                key={transaction.id} 
                transaction={transaction}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
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
