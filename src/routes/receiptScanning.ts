import { Router } from 'express';
import { receiptScanningController } from '../controllers/receiptScanningController';

const router = Router();

// POST /api/receipt-scanning/scan - Scan single receipt
router.post('/scan', receiptScanningController.scanReceipt.bind(receiptScanningController));

// POST /api/receipt-scanning/batch - Scan multiple receipts
router.post('/batch', receiptScanningController.scanBatchReceipts.bind(receiptScanningController));

// GET /api/receipt-scanning/stats - Get scanning statistics
router.get('/stats', receiptScanningController.getScanningStats.bind(receiptScanningController));

// POST /api/receipt-scanning/validate - Validate scanned receipt
router.post('/validate', receiptScanningController.validateReceipt.bind(receiptScanningController));

export default router;
