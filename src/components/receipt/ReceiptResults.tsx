
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/utils';

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
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Extracted Data</h3>
        <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
          {confidence}% confidence
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
              <p className="text-sm text-slate-500">Category</p>
              <p className="font-medium">{scanResults.category}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Payment Method</p>
              <p className="font-medium">{scanResults.paymentMethod}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm text-slate-500 mb-2">Items</p>
            {scanResults.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm mb-1">
                <span>{item.quantity || 1}x {item.name}</span>
                <span>{formatCurrency(item.price * (item.quantity || 1), scanResults.currency || selectedCurrency.code)}</span>
              </div>
            ))}
          </div>
          
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
              <span>{formatCurrency(scanResults.amount, scanResults.currency || selectedCurrency.code)}</span>
            </div>
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
          Accept & Save
        </Button>
      </div>
    </div>
  );
}
