
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileX, Loader2, Camera, Upload } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface ReceiptImageUploadProps {
  onScan: () => void;
  isScanning: boolean;
  file: File | null;
  previewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  /** Accept a raw File (e.g. from the camera) */
  onFileSet?: (file: File) => void;
}

export default function ReceiptImageUpload({
  onScan,
  isScanning,
  file,
  previewUrl,
  onFileChange,
  onClearFile,
  onFileSet,
}: ReceiptImageUploadProps) {
  const [showCamera, setShowCamera] = useState(false);

  const handleCameraCapture = (capturedFile: File) => {
    setShowCamera(false);
    onFileSet?.(capturedFile);
  };

  // While the camera is open, render only the camera view
  if (showCamera) {
    return <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />;
  }

  return (
    <>
      {/* Source selection buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex flex-col items-center gap-1.5 h-auto py-4"
          onClick={() => setShowCamera(true)}
          disabled={isScanning}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs">Open Camera</span>
        </Button>

        <Label
          htmlFor="receipt-file"
          className="flex flex-col items-center gap-1.5 h-auto py-4 border rounded-md cursor-pointer hover:bg-accent transition-colors text-sm font-medium"
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">Upload File</span>
          <Input
            id="receipt-file"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </Label>
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
