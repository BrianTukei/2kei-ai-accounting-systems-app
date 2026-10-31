import { Router } from 'express';
import { ReceiptScannerAPI } from '../api/receiptScanner';
import { ChatbotAPI } from '../api/chatbot';
import { ActionAIController } from '../api/actionAI';
import authRoutes from './auth';
import { adminEmailController } from '../controllers/adminEmail';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Auth Routes (login/signup — rate-limited at server level)
router.use('/auth', authRoutes);

// ── Admin email / broadcast — AUTH + ADMIN required ───────
router.post(
  '/admin/broadcast-email',
  requireAuth,
  requireAdmin,
  adminEmailController.sendLegacyBroadcast
);
router.post(
  '/admin/send-email',
  requireAuth,
  requireAdmin,
  adminEmailController.sendEmail
);
// Webhooks from email providers use their own secrets, not user JWT
router.post('/admin/email-webhook', adminEmailController.providerWebhook);
router.get(
  '/admin/email-status',
  requireAuth,
  requireAdmin,
  adminEmailController.verifyTransport
);

// Receipt Scanner — authenticated users only
router.post('/scan-receipt', requireAuth, ReceiptScannerAPI.scanReceipt);
router.get('/receipts', requireAuth, ReceiptScannerAPI.getUserReceipts);
router.post('/validate-receipt', requireAuth, ReceiptScannerAPI.validateReceipt);
router.delete('/receipts/:id', requireAuth, ReceiptScannerAPI.deleteReceipt);
router.post('/categorize-expense', requireAuth, ReceiptScannerAPI.categorizeExpense);

// Chatbot — authenticated
router.post('/chatbot', requireAuth, ChatbotAPI.handleChatbotRequest);
router.get('/chatbot/status', requireAuth, ChatbotAPI.getChatbotStatus);
router.post('/chatbot/quick-actions', requireAuth, ChatbotAPI.getQuickActions);
router.post('/chatbot/suggestions', requireAuth, ChatbotAPI.getSuggestions);
router.post('/chatbot/feedback', requireAuth, ChatbotAPI.submitFeedback);
router.get('/chatbot/analytics', requireAuth, requireAdmin, ChatbotAPI.getAnalytics);

// Action AI — authenticated
router.post('/action-ai/process', requireAuth, ActionAIController.processMessage);
router.post('/action-ai/execute', requireAuth, ActionAIController.executeAction);
router.post('/action-ai/chat', requireAuth, ActionAIController.chatWithAction);
router.get('/action-ai/capabilities', requireAuth, ActionAIController.getCapabilities);
router.post('/action-ai/analyze', requireAuth, ActionAIController.analyzeFinancialData);
router.get('/action-ai/status', requireAuth, ActionAIController.getStatus);
router.post('/action-ai/batch', requireAuth, ActionAIController.executeBatch);

// AI Service Status
router.get('/ai-status', requireAuth, ReceiptScannerAPI.getAIStatus);

export default router;
