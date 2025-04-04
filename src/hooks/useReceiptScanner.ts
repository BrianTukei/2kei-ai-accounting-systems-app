
import { useState } from 'react';
import { toast } from 'sonner';

interface ReceiptData {
  amount: number;
  date: string;
  description: string;
  category: string;
  vendor?: string;
  items?: Array<{ name: string; price: number; quantity?: number }>;
  taxAmount?: number;
  subtotal?: number;
  receiptNumber?: string;
  paymentMethod?: string;
}

interface UseReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void;
}

export function useReceiptScanner({ onScanComplete }: UseReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
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
}
