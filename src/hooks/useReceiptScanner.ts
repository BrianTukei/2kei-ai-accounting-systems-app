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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setScanResults(null);
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
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('receipts')
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const saveReceiptToDatabase = async (receiptData: any, imageUrl: string): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
          image_url: imageUrl,
          thumbnail_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving receipt:', error);
      throw new Error('Failed to save receipt to database');
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

  const simulateScanning = async () => {
    if (!file) {
      toast.error('Please select an image first');
      return;
    }

    setIsScanning(true);
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to scan receipts');
        return;
      }

      toast.info('Processing receipt with AI...');

      // Perform OCR scanning
      const ocrResult = await performOCRScanning(file);
      
      // Upload image to Supabase storage
      const imageUrl = await uploadImageToSupabase(file);
      
      // Save to database
      await saveReceiptToDatabase(ocrResult, imageUrl);

      // Set results for display
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
        currency: ocrResult.currency
      });
      
      setConfidence(ocrResult.confidence);

      // Call the completion callback with the extracted data
      onScanComplete({
        amount: ocrResult.amount,
        date: ocrResult.date,
        description: ocrResult.description,
        category: ocrResult.category,
        vendor: ocrResult.vendor,
        currency: ocrResult.currency,
        items: ocrResult.items,
        taxAmount: ocrResult.taxAmount,
        subtotal: ocrResult.subtotal,
        receiptNumber: ocrResult.receiptNumber,
        paymentMethod: ocrResult.paymentMethod
      });

      toast.success('Receipt scanned successfully!');
    } catch (error) {
      console.error('Scanning failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scan receipt');
    } finally {
      setIsScanning(false);
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
    simulateScanning,
    setScanResults
  };
};