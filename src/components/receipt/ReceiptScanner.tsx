
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';
import { toast } from 'sonner';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import ReceiptImageUpload from './ReceiptImageUpload';
import ReceiptResults from './ReceiptResults';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
    vendor?: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    taxAmount?: number;
    subtotal?: number;
  }) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    isScanning,
    file,
    previewUrl,
    scanResults,
    confidence,
    handleFileChange,
    clearFile,
    simulateScanning,
    setScanResults
  } = useReceiptScanner({ onScanComplete });

  const acceptResults = () => {
    setIsOpen(false);
    toast.success('Receipt data saved successfully!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Scan className="h-4 w-4" />
          Scan Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Receipt Scanner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!scanResults ? (
            <ReceiptImageUpload
              onScan={simulateScanning}
              isScanning={isScanning}
              file={file}
              previewUrl={previewUrl}
              onFileChange={handleFileChange}
              onClearFile={clearFile}
            />
          ) : (
            <ReceiptResults
              scanResults={scanResults}
              confidence={confidence}
              onRescan={() => setScanResults(null)}
              onAccept={acceptResults}
            />
          )}
          
          <p className="text-xs text-slate-500 text-center">
            Our AI will extract transaction details automatically from your receipt.
            {isScanning && " Processing image, please wait..."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
