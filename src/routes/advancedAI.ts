// Advanced AI Routes - Complete AI SaaS API
// Advanced AI SaaS Routes for 2K AI Accounting Systems

import { Router } from 'express';
import { advancedAIController } from '../controllers/advancedAIController';

const router = Router();

// ===== Chat Interface Routes =====

// Create new chat session
router.post('/chat/session', advancedAIController.createChatSession.bind(advancedAIController));

// Send message to AI
router.post('/chat/message', advancedAIController.sendMessage.bind(advancedAIController));

// Get chat session details
router.get('/chat/session/:sessionId', advancedAIController.getChatSession.bind(advancedAIController));

// Get contextual suggestions
router.get('/chat/suggestions/:sessionId', advancedAIController.getContextualSuggestions.bind(advancedAIController));

// Export conversation
router.get('/chat/export/:sessionId', advancedAIController.exportConversation.bind(advancedAIController));

// Get session analytics
router.get('/chat/analytics/:sessionId', advancedAIController.getSessionAnalytics.bind(advancedAIController));

// Start real-time session
router.post('/chat/realtime', advancedAIController.startRealTimeSession.bind(advancedAIController));

// Handle voice message
router.post('/chat/voice', advancedAIController.handleVoiceMessage.bind(advancedAIController));

// Clear session messages
router.delete('/chat/session/:sessionId/clear', advancedAIController.clearSession.bind(advancedAIController));

// Delete session
router.delete('/chat/session/:sessionId', advancedAIController.deleteSession.bind(advancedAIController));

// ===== AI Reasoning Engine Routes =====

// Analyze financial health
router.post('/ai/analyze-financial-health', advancedAIController.analyzeFinancialHealth.bind(advancedAIController));

// Detect anomalies in transactions
router.post('/ai/detect-anomalies', advancedAIController.detectAnomalies.bind(advancedAIController));

// Forecast cash flow
router.post('/ai/forecast-cashflow', advancedAIController.forecastCashflow.bind(advancedAIController));

// Optimize expenses
router.post('/ai/optimize-expenses', advancedAIController.optimizeExpenses.bind(advancedAIController));

// ===== Action Engine Routes =====

// Execute single action
router.post('/ai/action/execute', advancedAIController.executeAction.bind(advancedAIController));

// Execute batch actions
router.post('/ai/action/batch', advancedAIController.executeBatchActions.bind(advancedAIController));

// Get action history
router.get('/ai/action/history', advancedAIController.getActionHistory.bind(advancedAIController));

// ===== Memory System Routes =====

// Update user profile
router.put('/ai/memory/profile', advancedAIController.updateUserProfile.bind(advancedAIController));

// Get user profile
router.get('/ai/memory/profile', advancedAIController.getUserProfile.bind(advancedAIController));

// Update financial metrics
router.put('/ai/memory/metrics', advancedAIController.updateFinancialMetrics.bind(advancedAIController));

// Get financial metrics
router.get('/ai/memory/metrics', advancedAIController.getFinancialMetrics.bind(advancedAIController));

// Get memory analytics
router.get('/ai/memory/analytics', advancedAIController.getMemoryAnalytics.bind(advancedAIController));

// ===== RAG (Retrieval Augmented Generation) Routes =====

// Search business data
router.post('/ai/rag/search', advancedAIController.searchBusinessData.bind(advancedAIController));

// ===== Advanced Features Routes =====

// Generate quick actions
router.get('/ai/quick-actions', advancedAIController.generateQuickActions.bind(advancedAIController));

export default router;
