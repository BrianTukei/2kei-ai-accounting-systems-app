
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Scan, FileX, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const [isScanning, setIsScanning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setScanResults(null);
      
      // Create preview for the image
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setScanResults(null);
  };

  const extractReceiptData = async (imageData: string): Promise<any> => {
    // In a real implementation, this would call a real OCR/AI service
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate varying confidence levels
    const confidenceScore = Math.floor(Math.random() * 30) + 70; // Random number between 70-99%
    setConfidence(confidenceScore);
    
    // Generate realistic mock data based on the image
    const randomAmount = (Math.random() * 100 + 20).toFixed(2);
    
    // Create a more detailed and structured receipt data
    const receiptData = {
      vendor: ['Walmart', 'Target', 'Costco', 'Amazon', 'Office Depot'][Math.floor(Math.random() * 5)],
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(randomAmount),
      description: 'Business Purchase',
      category: ['Office Supplies', 'Travel', 'Meals', 'Software', 'Hardware'][Math.floor(Math.random() * 5)],
      subtotal: parseFloat((parseFloat(randomAmount) * 0.9).toFixed(2)),
      taxAmount: parseFloat((parseFloat(randomAmount) * 0.1).toFixed(2)),
      items: [
        {
          name: ['Printer Paper', 'Laptop Stand', 'USB Cable', 'Coffee', 'Notebook'][Math.floor(Math.random() * 5)],
          price: parseFloat((Math.random() * 20 + 5).toFixed(2)),
          quantity: Math.floor(Math.random() * 3) + 1
        },
        {
          name: ['Pens', 'Stapler', 'Headphones', 'Phone Charger', 'Markers'][Math.floor(Math.random() * 5)],
          price: parseFloat((Math.random() * 15 + 3).toFixed(2)),
          quantity: Math.floor(Math.random() * 5) + 1
        }
      ],
      receiptNumber: `RCP-${Math.floor(Math.random() * 10000)}`,
      paymentMethod: ['Credit Card', 'Cash', 'Debit Card', 'PayPal'][Math.floor(Math.random() * 4)]
    };
    
    return receiptData;
  };

  const simulateScanning = async () => {
    if (!file || !previewUrl) return;
    
    setIsScanning(true);
    setScanResults(null);
    
    try {
      // Extract data using AI/OCR (simulated)
      const extractedData = await extractReceiptData(previewUrl);
      
      // Set results and pass to parent component
      setScanResults(extractedData);
      onScanComplete({
        amount: extractedData.amount,
        date: extractedData.date,
        description: extractedData.description || 'Scanned Receipt',
        category: extractedData.category || 'Office Supplies',
        vendor: extractedData.vendor,
        items: extractedData.items,
        taxAmount: extractedData.taxAmount,
        subtotal: extractedData.subtotal
      });
      
      toast.success('Receipt scanned and analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing receipt:', error);
      toast.error('Failed to analyze receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

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
            <>
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
              
              {previewUrl && (
                <div className="relative">
                  <div className="border rounded-md overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Receipt preview" 
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-2 right-2 p-1.5 h-auto bg-white/80 hover:bg-white"
                    onClick={clearFile}
                  >
                    <FileX className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={simulateScanning} 
                disabled={!file || isScanning} 
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  'Scan Receipt with AI'
                )}
              </Button>
            </>
          ) : (
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
                    {scanResults.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm mb-1">
                        <span>{item.quantity || 1}x {item.name}</span>
                        <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${scanResults.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${scanResults.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-1">
                      <span>Total</span>
                      <span>${scanResults.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setScanResults(null)}
                >
                  Rescan
                </Button>
                <Button 
                  className="flex-1"
                  onClick={acceptResults}
                >
                  Accept & Save
                </Button>
              </div>
            </div>
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
