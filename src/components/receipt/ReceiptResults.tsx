
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, Sparkles } from 'lucide-react';

interface ReceiptResultsProps {
  scanResults: {
    vendor: string;
    date: string;
    amount: number;
    description: string;
    category: string;
    currency: string;
    subtotal: number;
    taxAmount: number;
    items: Array<{ name: string; price: number; quantity?: number }>;
    receiptNumber: string;
    paymentMethod: string;
    transactionType?: 'income' | 'expense';
    suggestedAccount?: string;
  };
  confidence: number;
  onRescan: () => void;
  onAccept: () => void;
}

export default function ReceiptResults({ 
  scanResults, 
  confidence, 
  onRescan, 
  onAccept 
}: ReceiptResultsProps) {
  const { selectedCurrency } = useCurrency();
  const txType = scanResults.transactionType || 'expense';
  const isIncome = txType === 'income';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isIncome ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
            {isIncome ? 'Income' : 'Expense'}
          </Badge>
          <div className={`text-xs px-2 py-1 rounded-full ${
            confidence >= 70 ? 'bg-green-100 text-green-800' :
            confidence >= 40 ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {confidence}% confidence
          </div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-slate-500">Vendor</p>
              <p className="font-medium">{scanResults.vendor}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Date</p>
              <p className="font-medium">{scanResults.date}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">AI Category</p>
              <p className="font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                {scanResults.suggestedAccount || scanResults.category}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Payment Method</p>
              <p className="font-medium">{scanResults.paymentMethod}</p>
            </div>
          </div>

          {scanResults.receiptNumber && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-slate-500">Receipt #</p>
                <p className="font-medium text-xs font-mono">{scanResults.receiptNumber}</p>
              </div>
            </>
          )}
          
          {scanResults.items.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-slate-500 mb-2">Items Detected</p>
                {scanResults.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm mb-1">
                    <span>{item.quantity || 1}x {item.name}</span>
                    <span>{formatCurrency(item.price * (item.quantity || 1), scanResults.currency || selectedCurrency.code)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(scanResults.subtotal, scanResults.currency || selectedCurrency.code)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatCurrency(scanResults.taxAmount, scanResults.currency || selectedCurrency.code)}</span>
            </div>
            <div className="flex justify-between font-bold mt-1">
              <span>Total</span>
              <span className={isIncome ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(scanResults.amount, scanResults.currency || selectedCurrency.code)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 rounded-md p-3">
            <p className="text-xs text-blue-700">
              <Sparkles className="h-3 w-3 inline mr-1" />
              <strong>AI will auto-create</strong> a <strong>{isIncome ? 'income' : 'expense'}</strong> transaction 
              under <strong>{scanResults.suggestedAccount || scanResults.category}</strong> and 
              record a double-entry journal entry in your books.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onRescan}
        >
          Rescan
        </Button>
        <Button 
          className="flex-1"
          onClick={onAccept}
        >
          Accept & Add to Books
        </Button>
      </div>
    </div>
  );
}
