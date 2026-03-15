import { Router } from 'express';
import { ReceiptScannerAPI } from '../api/receiptScanner';
import { ChatbotAPI } from '../api/chatbot';

const router = Router();

// Receipt Scanner Routes
router.post('/scan-receipt', ReceiptScannerAPI.scanReceipt);
router.get('/receipts', ReceiptScannerAPI.getUserReceipts);
router.post('/validate-receipt', ReceiptScannerAPI.validateReceipt);
router.delete('/receipts/:id', ReceiptScannerAPI.deleteReceipt);
router.post('/categorize-expense', ReceiptScannerAPI.categorizeExpense);

// Chatbot Routes
router.post('/chatbot', ChatbotAPI.handleChatbotRequest);
router.get('/chatbot/status', ChatbotAPI.getChatbotStatus);
router.post('/chatbot/quick-actions', ChatbotAPI.getQuickActions);
router.post('/chatbot/suggestions', ChatbotAPI.getSuggestions);
router.post('/chatbot/feedback', ChatbotAPI.submitFeedback);
router.get('/chatbot/analytics', ChatbotAPI.getAnalytics);

// AI Service Status
router.get('/ai-status', ReceiptScannerAPI.getAIStatus);

export default router;
