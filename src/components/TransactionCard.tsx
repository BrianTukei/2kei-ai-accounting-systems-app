
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMemo } from 'react';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  currency?: string;                // Currency of this transaction (e.g. 'EUR')
  original_amount?: number;         // Amount in original currency
  original_currency?: string;       // Original currency code
  base_currency_amount?: number;    // Amount converted to base currency (USD)
  exchange_rate_used?: number;      // Exchange rate at time of creation
  exchange_rate_date?: string;      // When the rate was captured
  convertedAmount?: number;
  conversionRate?: number;
  lastUpdated?: string;
  metadata?: {
    vendor?: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    taxAmount?: number;
    subtotal?: number;
    [key: string]: any;
  };
}

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export default function TransactionCard({ 
  transaction, 
  className,
  onEdit,
  onDelete
}: TransactionCardProps) {
  const { displayAmount, selectedCurrency } = useCurrency();
  const { id, type, amount, category, description, date, currency: txCurrency } = transaction;
  const isIncome = type === 'income';
  
  // Check if we have forex conversion data
  const hasForexData = transaction.convertedAmount !== undefined && transaction.conversionRate !== undefined;
  const isStaleData = hasForexData && transaction.lastUpdated 
    ? Date.now() - new Date(transaction.lastUpdated).getTime() > 30 * 60 * 1000
    : false;

  // Display converted amounts using context function (simple pattern like pricing plans)
  const displayConverted = useMemo(() => {
    const txCur = txCurrency || 'USD';
    return displayAmount(Math.abs(amount), txCur, selectedCurrency.code);
  }, [amount, txCurrency, selectedCurrency.code, displayAmount]);

  // Show original amount as reference if different currency
  const displayOriginal = useMemo(() => {
    if (!txCurrency || txCurrency === selectedCurrency.code) return null;
    return displayAmount(Math.abs(amount), txCurrency, txCurrency);
  }, [amount, txCurrency, selectedCurrency.code, displayAmount]);
  
  return (
    <Card 
      className={cn(
        "glass-card glass-card-hover overflow-hidden",
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
              {isIncome ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownLeft className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{category}</h3>
                {txCurrency && txCurrency !== selectedCurrency.code && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {txCurrency}
                  </Badge>
                )}
                {hasForexData && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {transaction.original_currency || txCurrency || 'USD'}
                  </Badge>
                )}
                {isStaleData && (
                  <Badge variant="outline" className="text-xs text-yellow-600 dark:text-yellow-400">
                    Stale
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{description}</p>
              {hasForexData && (
                <p className="text-xs text-muted-foreground mt-1">
                  @ {transaction.conversionRate?.toFixed(6)} rate
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="text-right">
              <p className={cn(
                "font-semibold text-sm",
                isIncome ? "text-green-600" : "text-red-600"
              )}>
                {isIncome ? '+' : '-'}{displayConverted}
              </p>
              {displayOriginal && (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  (orig: {displayOriginal})
                </p>
              )}
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
            
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
