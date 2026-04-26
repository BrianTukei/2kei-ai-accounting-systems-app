import { Router } from 'express';
import { ReceiptScannerAPI } from '../api/receiptScanner';
import { ChatbotAPI } from '../api/chatbot';
import { ActionAIController } from '../api/actionAI';
import authRoutes from './auth';

const router = Router();

// Auth Routes
router.use('/auth', authRoutes);

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

// Action AI Routes
router.post('/action-ai/process', ActionAIController.processMessage);
router.post('/action-ai/execute', ActionAIController.executeAction);
router.post('/action-ai/chat', ActionAIController.chatWithAction);
router.get('/action-ai/capabilities', ActionAIController.getCapabilities);
router.post('/action-ai/analyze', ActionAIController.analyzeFinancialData);
router.get('/action-ai/status', ActionAIController.getStatus);
router.post('/action-ai/batch', ActionAIController.executeBatch);

// AI Service Status
router.get('/ai-status', ReceiptScannerAPI.getAIStatus);

export default router;
