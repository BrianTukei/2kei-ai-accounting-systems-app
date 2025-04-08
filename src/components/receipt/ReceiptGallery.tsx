
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Receipt {
  id: string;
  imageUrl: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  thumbnailUrl?: string;
}

export default function ReceiptGallery() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  useEffect(() => {
    // Load receipts from localStorage
    const storedReceipts = localStorage.getItem('scannedReceipts');
    if (storedReceipts) {
      setReceipts(JSON.parse(storedReceipts));
    }
  }, []);
  
  const handleDelete = (id: string) => {
    const updatedReceipts = receipts.filter(receipt => receipt.id !== id);
    setReceipts(updatedReceipts);
    localStorage.setItem('scannedReceipts', JSON.stringify(updatedReceipts));
  };
  
  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsViewerOpen(true);
  };
  
  const handleDownload = (receipt: Receipt) => {
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = receipt.imageUrl;
    link.download = `receipt-${receipt.vendor}-${receipt.date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (receipts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-48">
        <p className="text-muted-foreground text-center p-4">
          No receipts have been scanned yet. Use the receipt scanner to add receipts to your gallery.
        </p>
      </Card>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {receipts.map(receipt => (
          <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square relative bg-slate-100">
              <img 
                src={receipt.thumbnailUrl || receipt.imageUrl}
                alt={`Receipt from ${receipt.vendor}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleView(receipt)}
              />
            </div>
            <CardContent className="p-3">
              <div className="text-sm font-medium truncate">{receipt.vendor}</div>
              <div className="text-xs text-muted-foreground">{new Date(receipt.date).toLocaleDateString()}</div>
              <div className="text-sm font-bold mt-1">${receipt.amount.toFixed(2)}</div>
              <div className="flex justify-between mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => handleView(receipt)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => handleDownload(receipt)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(receipt.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        {selectedReceipt && (
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedReceipt.vendor} - ${selectedReceipt.amount.toFixed(2)}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-4">
              <div className="border rounded-md overflow-hidden">
                <img 
                  src={selectedReceipt.imageUrl} 
                  alt={`Receipt from ${selectedReceipt.vendor}`}
                  className="w-full h-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div>{new Date(selectedReceipt.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Category</div>
                  <div>{selectedReceipt.category}</div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
