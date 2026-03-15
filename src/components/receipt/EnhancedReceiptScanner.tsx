import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scan, GalleryHorizontal, Download, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { receiptParser, ParsedReceipt } from '@/services/ai/receiptParser';
import { pdfService } from '@/services/pdfService';
import { userCompanyService } from '@/services/userCompanyService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import ReceiptImageUpload from './ReceiptImageUpload';
import ReceiptResults from './ReceiptResults';
import ReceiptGallery from './ReceiptGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EnhancedReceiptScannerProps {
  onScanComplete?: (data: ParsedReceipt) => void;
}

export default function EnhancedReceiptScanner({ onScanComplete }: EnhancedReceiptScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [scanResults, setScanResults] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string>('');

  const { user } = useAuth();
  const { org: organization } = useOrganization();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl('');
    setScanResults(null);
    setError('');
  };

  const simulateScanning = async () => {
    if (!file) return;

    setIsScanning(true);
    setError('');
    setScanProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Perform OCR and AI parsing
      const results = await receiptParser.parseReceiptFromImage(file);
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setScanResults(results);
      
      // Store in gallery
      await storeReceiptInGallery(results, previewUrl);
      
      toast.success('Receipt scanned successfully!');
    } catch (err) {
      console.error('Scanning failed:', err);
      setError('Failed to scan receipt. Please try again.');
      toast.error('Receipt scanning failed');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanProgress(0), 1000);
    }
  };

  const storeReceiptInGallery = async (results: ParsedReceipt, imageUrl: string) => {
    try {
      const storedReceipts = localStorage.getItem('scannedReceipts');
      const receipts = storedReceipts ? JSON.parse(storedReceipts) : [];
      
      receipts.push({
        id: `receipt-${Date.now()}`,
        imageUrl,
        thumbnailUrl: imageUrl,
        merchant: results.merchant,
        amount: results.total,
        originalAmount: results.original_total,
        currency: results.currency,
        originalCurrency: results.original_currency,
        date: results.date,
        paymentMethod: results.payment_method,
        items: results.items,
        tax: results.tax,
        scannedAt: new Date().toISOString(),
        userId: user?.id,
        companyId: organization?.id,
      });
      
      localStorage.setItem('scannedReceipts', JSON.stringify(receipts));
    } catch (error) {
      console.error('Error saving receipt to gallery:', error);
    }
  };

  const acceptResults = () => {
    if (scanResults) {
      onScanComplete?.(scanResults);
      setIsOpen(false);
      toast.success('Receipt data saved successfully!');
    }
  };

  const downloadPDF = async () => {
    if (!scanResults) return;

    try {
      const company = organization ? userCompanyService.getCompany(organization.id) : undefined;
      const pdf = pdfService.generateReceiptPDF(scanResults, company, user || undefined);
      const filename = `receipt-${scanResults.merchant}-${scanResults.date}.pdf`;
      pdfService.downloadPDF(pdf, filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const shareResults = async () => {
    if (!scanResults) return;

    try {
      const shareData = {
        title: `Receipt from ${scanResults.merchant}`,
        text: `Amount: ${scanResults.total} ${scanResults.currency}\nDate: ${scanResults.date}\nItems: ${scanResults.items.length}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Receipt shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(JSON.stringify(scanResults, null, 2));
        toast.success('Receipt data copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share receipt');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Scan className="h-4 w-4" />
          AI Receipt Scanner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            2K AI Receipt Scanner
          </DialogTitle>
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
              <div className="space-y-4">
                <ReceiptImageUpload
                  onScan={simulateScanning}
                  isScanning={isScanning}
                  file={file}
                  previewUrl={previewUrl}
                  onFileChange={handleFileChange}
                  onClearFile={clearFile}
                  onFileSet={setFile}
                />
                
                {isScanning && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Scanning Progress</span>
                          <span className="text-sm text-muted-foreground">{scanProgress}%</span>
                        </div>
                        <Progress value={scanProgress} className="w-full" />
                        <p className="text-xs text-muted-foreground">
                          {scanProgress < 30 && "Extracting text from image..."}
                          {scanProgress >= 30 && scanProgress < 60 && "Analyzing receipt structure..."}
                          {scanProgress >= 60 && scanProgress < 90 && "Converting currencies and categorizing items..."}
                          {scanProgress >= 90 && "Finalizing results..."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {error && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">✨ AI Features</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Automatic currency detection & conversion</li>
                        <li>• Smart item categorization</li>
                        <li>• Multi-language receipt support</li>
                        <li>• PDF generation with company branding</li>
                        <li>• Receipt gallery & sharing</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Scan Results
                          </span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={shareResults}>
                              <Share2 className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                            <Button variant="outline" size="sm" onClick={downloadPDF}>
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Merchant</label>
                            <p className="font-semibold">{scanResults.merchant}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <p className="font-semibold">{scanResults.date}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                            <p className="font-semibold">{scanResults.payment_method}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Currency</label>
                            <p className="font-semibold">
                              {scanResults.original_currency} → {scanResults.currency}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Items</label>
                          <div className="mt-2 space-y-2">
                            {scanResults.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {item.category}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {formatCurrency(item.original_price, scanResults.original_currency)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {formatCurrency(item.price, scanResults.currency)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">Original Total</p>
                              <p className="font-semibold">
                                {formatCurrency(scanResults.original_total, scanResults.original_currency)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">USD Total</p>
                              <p className="font-semibold text-lg">
                                {formatCurrency(scanResults.total, scanResults.currency)}
                              </p>
                            </div>
                          </div>
                          {scanResults.tax > 0 && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              Tax: {formatCurrency(scanResults.tax, scanResults.currency)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex gap-2">
                      <Button onClick={acceptResults} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept & Save
                      </Button>
                      <Button variant="outline" onClick={() => setScanResults(null)}>
                        Scan Another
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="gallery" className="py-2">
                <ReceiptGallery />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      );
    }
