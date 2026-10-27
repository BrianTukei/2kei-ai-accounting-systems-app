import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMemo } from 'react';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  currency?: string;
  original_amount?: number;
  original_currency?: string;
  originalAmount?: number;
  originalCurrency?: string;
  base_currency_amount?: number;
  exchange_rate_used?: number;
  exchange_rate_date?: string;
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
  const { formatCurrency, selectedCurrency } = useCurrency();
  const { id, type, amount, category, description, date, currency: txCurrency } = transaction;
  const isIncome = type === 'income';

  // Prefer original_amount when available, otherwise fall back to amount
  const sourceAmount = transaction.original_amount ?? transaction.originalAmount ?? amount;
  const sourceCurrency = (
    transaction.original_currency ?? transaction.originalCurrency ?? txCurrency ?? 'USD'
  ).toUpperCase();

  // Always convert + format into the user's currently selected currency.
  // When UGX is selected → only UGX is shown. No badges, no "orig:" text.
  const displayConverted = useMemo(
    () => formatCurrency(Math.abs(sourceAmount), sourceCurrency),
    [formatCurrency, sourceAmount, sourceCurrency, selectedCurrency.code]
  );
  
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
              </div>
              <p className="text-xs text-muted-foreground truncate">{description}</p>
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