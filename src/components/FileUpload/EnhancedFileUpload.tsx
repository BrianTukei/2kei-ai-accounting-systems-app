/**
 * EnhancedFileUpload.tsx
 * ─────────────────────
 * Production-ready file upload component with:
 *  - Drag & Drop support
 *  - Validation (type, size)
 *  - Progress tracking
 *  - Error handling
 *  - Multiple file type support (PDF, JPG, PNG, CSV, Excel)
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2,
  FileIcon, Trash2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EnhancedFileUploadProps {
  onFileSelect: (file: File) => Promise<void> | void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  maxSizeLabel?: string;
  disabled?: boolean;
  multiple?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'text/csv': 'CSV',
  'application/vnd.ms-excel': 'Excel (XLS)',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (XLSX)',
};

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFileSelect,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxSizeLabel = '10MB',
  disabled = false,
  multiple = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      const supportedTypes = acceptedTypes
        .map((t) => FILE_TYPE_LABELS[t] || t)
        .filter((v, i, a) => a.indexOf(v) === i) // unique
        .join(', ');
      return `File type not supported. Please upload: ${supportedTypes}`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeLabel} limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 30, 90));
      }, 300);

      // Call parent handler
      await onFileSelect(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      toast.success('File uploaded successfully!');

      // Reset after 2 seconds
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setSuccess(false);
        setSelectedFile(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      toast.error('Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getSupportedFormatsText = () => {
    const unique = [...new Set(acceptedTypes.map((t) => FILE_TYPE_LABELS[t] || t))];
    return unique.join(', ');
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); !disabled && !uploading && setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200',
          disabled || uploading ? 'opacity-50 cursor-not-allowed' : '',
          dragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5',
          success ? 'border-green-300 bg-green-50/30 dark:bg-green-900/10' : '',
          error ? 'border-red-300 bg-red-50/30 dark:bg-red-900/10' : ''
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="hidden"
          aria-label="Upload file"
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Uploading {selectedFile?.name}…
              </p>
              <p className="text-sm text-slate-500 mt-1">{uploadProgress.toFixed(0)}%</p>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        ) : success ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">
                Upload Complete!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {selectedFile?.name} is ready for processing
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400" />
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Drop your file here
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or <span className="text-primary font-medium underline underline-offset-2">browse</span> to select
              </p>
            </div>
            <div className="text-xs text-slate-400 pt-2 space-y-1">
              <p>Supported formats: <span className="font-medium">{getSupportedFormatsText()}</span></p>
              <p>Maximum file size: <span className="font-medium">{maxSizeLabel}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && !uploading && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Selected file info */}
      {selectedFile && !uploading && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon className="w-5 h-5 text-slate-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      <div className="text-xs text-slate-500 space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
          <div className="space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-300">Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>For best results, use CSV or Excel files exported from your bank</li>
              <li>Ensure your file has columns for Date, Description, and Amount</li>
              <li>PDF files should be converted to CSV/Excel first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFileUpload;
