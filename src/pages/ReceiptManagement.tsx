import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Calendar, 
  DollarSign, 
  ShoppingCart,
  FileText,
  TrendingUp,
  Eye,
  Trash2,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import EnhancedReceiptScanner from '@/components/receipt/EnhancedReceiptScanner';
import { receiptParser, ParsedReceipt } from '@/services/ai/receiptParser';
import { pdfService } from '@/services/pdfService';
import { userCompanyService } from '@/services/userCompanyService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { currencyService } from '@/services/currencyService';

interface StoredReceipt extends ParsedReceipt {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  scannedAt: string;
  userId?: string;
  companyId?: string;
}

export default function ReceiptManagement() {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<StoredReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<StoredReceipt | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const { user } = useAuth();
  const { org: organization } = useOrganization();

  // Load receipts from storage
  useEffect(() => {
    loadReceipts();
  }, []);

  // Filter receipts based on search and tab
  useEffect(() => {
    let filtered = receipts;

    // Filter by user/organization
    if (user) {
      filtered = filtered.filter(receipt => 
        !receipt.userId || receipt.userId === user.id
      );
    }
    if (organization) {
      filtered = filtered.filter(receipt => 
        !receipt.companyId || receipt.companyId === organization.id
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        receipt.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        receipt.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab
    if (activeTab === 'recent') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(receipt => new Date(receipt.scannedAt) > sevenDaysAgo);
    } else if (activeTab === 'high-value') {
      filtered = filtered.filter(receipt => receipt.total > 100);
    } else if (activeTab === 'uncategorized') {
      filtered = filtered.filter(receipt => 
        receipt.items.some(item => item.category === 'Other')
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, activeTab, user, organization]);

  const loadReceipts = () => {
    try {
      const stored = localStorage.getItem('scannedReceipts');
      if (stored) {
        const receipts = JSON.parse(stored);
        setReceipts(receipts);
      }
    } catch (error) {
      console.error('Failed to load receipts:', error);
      toast.error('Failed to load receipts');
    }
  };

  const handleScanComplete = (results: ParsedReceipt) => {
    // The receipt is already stored in the scanner component
    loadReceipts(); // Refresh the list
    setIsScannerOpen(false);
  };

  const handleDeleteReceipt = (receiptId: string) => {
    try {
      const updated = receipts.filter(r => r.id !== receiptId);
      localStorage.setItem('scannedReceipts', JSON.stringify(updated));
      setReceipts(updated);
      toast.success('Receipt deleted successfully');
    } catch (error) {
      console.error('Failed to delete receipt:', error);
      toast.error('Failed to delete receipt');
    }
  };

  const handleDownloadPDF = async (receipt: StoredReceipt) => {
    try {
      const company = organization ? userCompanyService.getCompany(organization.id) : undefined;
      const pdf = pdfService.generateReceiptPDF(receipt, company, user || undefined);
      const filename = `receipt-${receipt.merchant}-${receipt.date}.pdf`;
      pdfService.downloadPDF(pdf, filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleShareReceipt = async (receipt: StoredReceipt) => {
    try {
      const shareData = {
        title: `Receipt from ${receipt.merchant}`,
        text: `Amount: ${receipt.total} ${receipt.currency}\nDate: ${receipt.date}\nItems: ${receipt.items.length}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Receipt shared successfully!');
      } else {
        await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
        toast.success('Receipt data copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share receipt');
    }
  };

  const getTotalStats = () => {
    const total = receipts.reduce((sum, r) => sum + r.total, 0);
    const originalTotal = receipts.reduce((sum, r) => sum + r.original_total, 0);
    const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);
    
    return {
      totalAmount: total,
      originalAmount: originalTotal,
      totalReceipts: receipts.length,
      totalItems,
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receipt Management</h1>
          <p className="text-gray-600">AI-powered receipt scanning and management</p>
        </div>
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Scan Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <EnhancedReceiptScanner onScanComplete={handleScanComplete} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold">{stats.totalReceipts}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount (USD)</p>
                <p className="text-2xl font-bold">
                  {currencyService.formatAmount(stats.totalAmount, 'USD')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Scanned</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Receipt</p>
                <p className="text-2xl font-bold">
                  {stats.totalReceipts > 0 
                    ? currencyService.formatAmount(stats.totalAmount / stats.totalReceipts, 'USD')
                    : '$0'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search receipts by merchant, items, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Receipts</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="high-value">High Value</TabsTrigger>
              <TabsTrigger value="uncategorized">Uncategorized</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              {filteredReceipts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Start by scanning your first receipt'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsScannerOpen(true)} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Scan First Receipt
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReceipts.map((receipt) => (
                    <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{receipt.merchant}</h3>
                              <Badge variant="outline">{receipt.payment_method}</Badge>
                              {receipt.original_currency !== receipt.currency && (
                                <Badge variant="secondary">
                                  {receipt.original_currency} → {receipt.currency}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Date</p>
                                <p className="font-medium">{receipt.date}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Items</p>
                                <p className="font-medium">{receipt.items.length}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Original</p>
                                <p className="font-medium">
                                  {currencyService.formatAmount(receipt.original_total, receipt.original_currency)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">USD</p>
                                <p className="font-medium">
                                  {currencyService.formatAmount(receipt.total, receipt.currency)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex flex-wrap gap-1">
                              {receipt.items.slice(0, 3).map((item, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {item.name}
                                </Badge>
                              ))}
                              {receipt.items.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{receipt.items.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReceipt(receipt)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(receipt)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShareReceipt(receipt)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReceipt(receipt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Receipt Details Modal */}
      {selectedReceipt && (
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receipt Details - {selectedReceipt.merchant}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="font-semibold">{selectedReceipt.date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="font-semibold">{selectedReceipt.payment_method}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Items</label>
                <div className="mt-2 space-y-2">
                  {selectedReceipt.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {currencyService.formatAmount(item.original_price, selectedReceipt.original_currency)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currencyService.formatAmount(item.price, selectedReceipt.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Original Total</p>
                    <p className="font-semibold text-lg">
                      {currencyService.formatAmount(selectedReceipt.original_total, selectedReceipt.original_currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">USD Total</p>
                    <p className="font-semibold text-lg">
                      {currencyService.formatAmount(selectedReceipt.total, selectedReceipt.currency)}
                    </p>
                  </div>
                </div>
                {selectedReceipt.tax > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Tax: {currencyService.formatAmount(selectedReceipt.tax, selectedReceipt.currency)}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => handleDownloadPDF(selectedReceipt)} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => handleShareReceipt(selectedReceipt)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
