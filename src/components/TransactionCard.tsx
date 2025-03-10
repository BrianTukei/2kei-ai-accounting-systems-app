
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
}

export default function TransactionCard({ transaction, className }: TransactionCardProps) {
  const { type, amount, category, description, date } = transaction;
  
  const isIncome = type === 'income';
  
  return (
    <Card 
      className={cn(
        "glass-card glass-card-hover overflow-hidden",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
          
          <div className="text-right">
            <p className={cn(
              "font-semibold",
              isIncome ? "text-green-600" : "text-red-600"
            )}>
              {isIncome ? '+' : '-'}${Math.abs(amount).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
