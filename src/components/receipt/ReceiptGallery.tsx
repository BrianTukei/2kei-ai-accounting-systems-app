import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Download, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Receipt = Database['public']['Tables']['receipts']['Row'];
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReceiptGallery() {
  const { selectedCurrency } = useCurrency();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Failed to load receipts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
      toast.success('Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Failed to delete receipt');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsViewerOpen(true);
  };

  const handleDownload = async (receipt: Receipt) => {
    try {
      const response = await fetch(receipt.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${receipt.vendor}-${receipt.date}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading receipts...</span>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No receipts found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Scan your first receipt to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
        {receipts.map((receipt) => (
          <Card key={receipt.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm truncate">{receipt.vendor}</h4>
                  <p className="text-xs text-muted-foreground">{receipt.date}</p>
                  <p className="text-xs bg-secondary px-2 py-1 rounded mt-1 inline-block">
                    {receipt.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">
                    {formatCurrency(receipt.amount, receipt.currency || selectedCurrency.code)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {receipt.confidence_score}% confidence
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleView(receipt)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(receipt)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(receipt.id)}
                  disabled={isDeleting === receipt.id}
                  className="text-destructive hover:text-destructive"
                >
                  {isDeleting === receipt.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vendor</p>
                      <p className="font-medium">{selectedReceipt.vendor}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{selectedReceipt.date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{selectedReceipt.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment</p>
                      <p className="font-medium">{selectedReceipt.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Receipt #</p>
                      <p className="font-medium">{selectedReceipt.receipt_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confidence</p>
                      <p className="font-medium">{selectedReceipt.confidence_score}%</p>
                    </div>
                  </div>
                  
                  {selectedReceipt.items && Array.isArray(selectedReceipt.items) && selectedReceipt.items.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Items</p>
                      <div className="space-y-1 text-sm">
                        {(selectedReceipt.items as any[]).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.quantity || 1}x {item.name}</span>
                            <span>
                              {formatCurrency(
                                item.price * (item.quantity || 1), 
                                selectedReceipt.currency || selectedCurrency.code
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1 text-sm pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedReceipt.subtotal, selectedReceipt.currency || selectedCurrency.code)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatCurrency(selectedReceipt.tax_amount, selectedReceipt.currency || selectedCurrency.code)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total</span>
                      <span>{formatCurrency(selectedReceipt.amount, selectedReceipt.currency || selectedCurrency.code)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <img 
                    src={selectedReceipt.image_url} 
                    alt="Receipt" 
                    className="max-h-[400px] w-auto object-contain rounded border"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}