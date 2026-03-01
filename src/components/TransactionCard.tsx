
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
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
  const { formatCurrency } = useCurrency();
  const { id, type, amount, category, description, date } = transaction;
  const isIncome = type === 'income';
  
  return (
    <Card 
      className={cn(
        "glass-card glass-card-hover overflow-hidden",
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
              {isIncome ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownLeft className="h-5 w-5" />
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-sm">{category}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className={cn(
                "font-semibold",
                isIncome ? "text-green-600" : "text-red-600"
              )}>
                {isIncome ? '+' : '-'}{formatCurrency(Math.abs(amount)).replace(/^[^\d]*/, '')}
              </p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
            
            <div className="flex">
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
