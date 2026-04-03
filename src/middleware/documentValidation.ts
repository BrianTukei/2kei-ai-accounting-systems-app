/**
 * Validation Middleware for AI Services
 * ─────────────────────────────────────
 * Guarantees incoming files/data are valid before sending to expensive OCR or OpenAI endpoints.
 */

import { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/csv',
  'application/vnd.ms-excel',
  'application/x-ofx', // OFX file
  'application/vnd.intu.qbw' // Quickbooks
];

export const fileValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file = req.file;

  // 1. Ensure file exists
  if (!file) {
    return res.status(400).json({
      status: 'failed',
      error: 'FILE_MISSING',
      message: 'No file provided for upload.',
    });
  }

  // 2. Validate MIME type against whitelist
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return res.status(415).json({
      status: 'failed',
      error: 'UNSUPPORTED_TYPE',
      message: 'Unsupported file type. Must be PDF, JPG, PNG, CSV, Excel, or OFX.',
    });
  }

  // 3. Limit File Size to 10MB to prevent DoS attacks on OCR parsing
  if (file.size > 10 * 1024 * 1024) {
    return res.status(413).json({
      status: 'failed',
      error: 'PAYLOAD_TOO_LARGE',
      message: 'File processing max limit is 10MB.',
    });
  }

  // File is safe to process
  next();
};

export const sanitizeOutputMiddleware = (outputData: any) => {
  // If the AI returned partial hallucinations, strip or format them here before DB save
  if (!outputData) return null;
  
  if (outputData.confidence_score && outputData.confidence_score < 0.85) {
    outputData.status = 'review_required';
  } else if (!outputData.status) {
    outputData.status = 'completed';
  }

  return outputData;
};
