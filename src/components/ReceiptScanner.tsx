
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scanner, Image as ImageIcon, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTransactions } from '@/hooks/useTransactions';

export default function ReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useTransactions();

  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsScanning(true);

    // Simulate OCR scanning (would use real OCR API in production)
    setTimeout(() => {
      // Mock receipt data extraction
      const mockReceiptData = {
        vendor: "Office Supplies Store",
        date: "Today",
        items: [
          { description: "Paper supplies", amount: 24.99 }
        ],
        total: 24.99
      };
      
      setReceiptData(mockReceiptData);
      setIsScanning(false);
      
      toast.success("Receipt scanned successfully");
    }, 2000);
  };

  const handleAddTransaction = () => {
    if (!receiptData) return;
    
    // Add transaction from scanned receipt
    addTransaction({
      amount: receiptData.total,
      type: 'expense',
      category: 'Office Supplies',
      description: `Receipt from ${receiptData.vendor}`,
      date: receiptData.date
    });
    
    // Clear receipt data
    setReceiptData(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast.success("Transaction added from receipt");
  };

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle>Receipt Scanner</CardTitle>
        <CardDescription>Scan receipts to add transactions automatically</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {!previewUrl ? (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={handleScanClick}
            >
              <Scanner className="h-10 w-10 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500">Click to scan a receipt</p>
              <p className="text-xs text-slate-400 mt-2">
                Supports .jpg, .png, and .pdf files
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <img 
                  src={previewUrl} 
                  alt="Receipt preview" 
                  className="w-full h-auto object-contain max-h-[200px]" 
                />
              </div>
              
              {isScanning ? (
                <div className="flex flex-col items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-sm text-slate-500">Scanning receipt...</p>
                </div>
              ) : receiptData && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-green-700">
                      <FileCheck className="h-5 w-5" />
                      <h3 className="font-medium">Receipt Scanned</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Vendor:</span> {receiptData.vendor}</p>
                      <p><span className="font-medium">Date:</span> {receiptData.date}</p>
                      <p><span className="font-medium">Total:</span> ${receiptData.total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-1/2"
                      onClick={() => {
                        setPreviewUrl(null);
                        setReceiptData(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="w-1/2" 
                      onClick={handleAddTransaction}
                    >
                      Add Transaction
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
