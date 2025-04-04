
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileX, Loader2 } from 'lucide-react';

interface ReceiptImageUploadProps {
  onScan: () => void;
  isScanning: boolean;
  file: File | null;
  previewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
}

export default function ReceiptImageUpload({
  onScan,
  isScanning,
  file,
  previewUrl,
  onFileChange,
  onClearFile
}: ReceiptImageUploadProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="receipt">Upload Receipt Image</Label>
        <Input
          id="receipt"
          type="file"
          accept="image/*"
          onChange={onFileChange}
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
            onClick={onClearFile}
          >
            <FileX className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}
      
      <Button 
        onClick={onScan} 
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
  );
}
