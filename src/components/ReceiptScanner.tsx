
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Scan } from 'lucide-react';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
  }) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const simulateScanning = () => {
    setIsScanning(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsScanning(false);
      
      // Mock extracted data (in real app, this would come from OCR service)
      const mockData = {
        amount: Math.floor(Math.random() * 100) + 20,
        date: new Date().toISOString().split('T')[0],
        description: 'Scanned Receipt',
        category: 'Office Supplies',
      };
      
      onScanComplete(mockData);
      setIsOpen(false);
      toast.success('Receipt scanned successfully!');
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Scan className="h-4 w-4" />
          Scan Receipt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Receipt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="receipt">Upload Receipt Image</Label>
            <Input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          
          {file && (
            <div className="border rounded-md p-2">
              <p className="text-sm text-slate-500">Selected file: {file.name}</p>
            </div>
          )}
          
          <Button 
            onClick={simulateScanning} 
            disabled={!file || isScanning} 
            className="w-full"
          >
            {isScanning ? 'Scanning...' : 'Scan Receipt'}
          </Button>
          
          <p className="text-xs text-slate-500 text-center">
            Our AI will extract transaction details automatically from your receipt.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
