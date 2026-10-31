
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scan, GalleryHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import ReceiptImageUpload from './ReceiptImageUpload';
import ReceiptResults from './ReceiptResults';
import ReceiptGallery from './ReceiptGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/contexts/OrganizationContext';
import orgStorage from '@/lib/orgStorage';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
    vendor?: string;
    currency?: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    taxAmount?: number;
    subtotal?: number;
    transactionType?: 'income' | 'expense';
    suggestedAccount?: string;
  }) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('scan');
  const [isAccepting, setIsAccepting] = useState(false);
  const { org } = useOrganization();

  const {
    isScanning,
    file,
    previewUrl,
    scanResults,
    confidence,
    handleFileChange,
    clearFile,
    setFileDirectly,
    simulateScanning,
    setScanResults,
    acceptScanResults,
  } = useReceiptScanner({ onScanComplete });

  const acceptResults = async () => {
    if (!scanResults) return;

    setIsAccepting(true);
    try {
      // Only now create the transaction via parent callback
      const ok = await acceptScanResults();
      if (!ok) return;

      // Store in local gallery after accept
      if (previewUrl && org) {
        try {
          const receipts = orgStorage.getJSON<any[]>(org.id, 'scannedReceipts', []);
          receipts.push({
            id: `receipt-${Date.now()}`,
            imageUrl: previewUrl,
            thumbnailUrl: previewUrl,
            vendor: scanResults.vendor || 'Unknown Vendor',
            amount: scanResults.amount,
            date: scanResults.date,
            category: scanResults.category,
            currency: scanResults.currency,
          });
          orgStorage.setJSON(org.id, 'scannedReceipts', receipts);
        } catch (error) {
          console.error('Error saving receipt to gallery:', error);
        }
      }

      setIsOpen(false);
      setScanResults(null);
      toast.success('Receipt added to books');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Scan className="h-4 w-4" />
          Scan Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Receipt Scanner</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="scan">
              <Scan className="h-4 w-4 mr-2" />
              Scan Receipt
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <GalleryHorizontal className="h-4 w-4 mr-2" />
              Receipt Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4 py-2">
            {!scanResults ? (
              <ReceiptImageUpload
                onScan={simulateScanning}
                isScanning={isScanning}
                file={file}
                previewUrl={previewUrl}
                onFileChange={handleFileChange}
                onClearFile={clearFile}
                onFileSet={setFileDirectly}
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
              Review the AI results, then press Accept &amp; Add to Books.
              {isScanning && ' Processing image, please wait...'}
              {isAccepting && ' Saving...'}
            </p>
          </TabsContent>

          <TabsContent value="gallery" className="py-2">
            <ReceiptGallery />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
