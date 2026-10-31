import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { performReceiptOCR } from '@/utils/receiptOCR';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

export interface ReceiptData {
  amount: number;
  date: string;
  description: string;
  category: string;
  vendor?: string;
  currency?: string;
  items?: Array<{ name: string; price: number; quantity?: number }>;
  taxAmount?: number;
  subtotal?: number;
  receiptNumber?: string;
  paymentMethod?: string;
  transactionType?: 'income' | 'expense';
  suggestedAccount?: string;
}

interface UseReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void;
}

export const useReceiptScanner = ({ onScanComplete }: UseReceiptScannerProps) => {
  const { selectedCurrency } = useCurrency();
  const [isScanning, setIsScanning] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setScanResults(null);
      setImageUrl(null);
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setScanResults(null);
    setConfidence(0);
    setImageUrl(null);
  };

  /** Accept a raw File (e.g. from CameraCapture) without a change-event */
  const setFileDirectly = (newFile: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setScanResults(null);
    setImageUrl(null);
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage.from('receipts').upload(fileName, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage.from('receipts').getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Non-fatal: scanning can still show results without storage
      return '';
    }
  };

  const saveReceiptToDatabase = async (receiptData: any, imgUrl: string): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          vendor: receiptData.vendor,
          amount: receiptData.amount,
          currency: receiptData.currency || selectedCurrency.code,
          date: receiptData.date,
          category: receiptData.category,
          description: receiptData.description,
          items: receiptData.items,
          subtotal: receiptData.subtotal,
          tax_amount: receiptData.taxAmount,
          receipt_number: receiptData.receiptNumber,
          payment_method: receiptData.paymentMethod,
          confidence_score: receiptData.confidence,
          image_url: imgUrl || null,
          thumbnail_url: imgUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving receipt:', error);
      // Non-fatal for Accept flow — transaction can still be created by parent
      return null;
    }
  };

  const performOCRScanning = async (imageFile: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await performReceiptOCR(img);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(imageFile);
    });
  };

  /**
   * Run OCR only — show results in UI.
   * Does NOT create a transaction. User must click Accept.
   */
  const simulateScanning = async () => {
    if (!file) {
      toast.error('Please select an image first');
      return;
    }

    setIsScanning(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to scan receipts');
        setIsScanning(false);
        return;
      }

      toast.info('Processing receipt with AI...');

      const ocrResult = await performOCRScanning(file);

      // Optional upload (does not create books entry)
      let uploadedUrl = '';
      try {
        uploadedUrl = await uploadImageToSupabase(file);
        setImageUrl(uploadedUrl);
      } catch {
        /* ignore */
      }

      setScanResults({
        vendor: ocrResult.vendor,
        date: ocrResult.date,
        amount: ocrResult.amount,
        description: ocrResult.description,
        category: ocrResult.category,
        subtotal: ocrResult.subtotal,
        taxAmount: ocrResult.taxAmount,
        items: ocrResult.items,
        receiptNumber: ocrResult.receiptNumber,
        paymentMethod: ocrResult.paymentMethod,
        currency: ocrResult.currency,
        transactionType: ocrResult.transactionType,
        suggestedAccount: ocrResult.suggestedAccount,
        confidence: ocrResult.confidence,
      });

      setConfidence(ocrResult.confidence);

      // IMPORTANT: do NOT call onScanComplete here — wait for Accept
      toast.success('Receipt scanned — review and Accept to add to books');
    } catch (error) {
      console.error('Scanning failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scan receipt');
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * User confirmed results — now save receipt row + notify parent to create transaction.
   */
  const acceptScanResults = async () => {
    if (!scanResults) {
      toast.error('No scan results to accept');
      return false;
    }

    try {
      if (imageUrl || previewUrl) {
        await saveReceiptToDatabase(
          { ...scanResults, confidence },
          imageUrl || ''
        );
      }

      onScanComplete({
        amount: scanResults.amount,
        date: scanResults.date,
        description: scanResults.description,
        category: scanResults.category,
        vendor: scanResults.vendor,
        currency: scanResults.currency,
        items: scanResults.items,
        taxAmount: scanResults.taxAmount,
        subtotal: scanResults.subtotal,
        receiptNumber: scanResults.receiptNumber,
        paymentMethod: scanResults.paymentMethod,
        transactionType: scanResults.transactionType,
        suggestedAccount: scanResults.suggestedAccount,
      });

      return true;
    } catch (error) {
      console.error('Accept failed:', error);
      toast.error('Failed to add receipt to books');
      return false;
    }
  };

  return {
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
  };
};
