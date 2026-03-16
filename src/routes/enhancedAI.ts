// Enhanced AI Routes - Complete JSON Action Execution
// Full implementation of all advanced AI accounting concepts

import { Router } from 'express';
import { enhancedAIController } from '../controllers/enhancedAIController';

const router = Router();

// ===== Core AI Chat Interface with JSON Action Execution =====

// Main AI chat endpoint with JSON action parsing
router.post('/chat', enhancedAIController.processAIChat.bind(enhancedAIController));

// Get contextual response
router.post('/contextual', enhancedAIController.getContextualResponse.bind(enhancedAIController));

// Submit feedback for learning
router.post('/feedback', enhancedAIController.submitFeedback.bind(enhancedAIController));

// ===== Automated Receipt Processing =====

// Process receipt upload with OCR
router.post('/receipt/process', enhancedAIController.processReceiptUpload.bind(enhancedAIController));

// ===== Financial Analysis =====

// Get comprehensive financial analysis
router.get('/analysis', enhancedAIController.getFinancialAnalysis.bind(enhancedAIController));

// Detect financial errors and anomalies
router.get('/errors', enhancedAIController.detectErrors.bind(enhancedAIController));

// ===== Autonomous Bookkeeping =====

// Run autonomous bookkeeping tasks
router.get('/autonomous', enhancedAIController.runAutonomousBookkeeping.bind(enhancedAIController));

// ===== Module Guidance =====

// Get guidance for specific modules
router.get('/guidance', enhancedAIController.getModuleGuidance.bind(enhancedAIController));

// ===== Advanced Features =====

// Generate financial forecast
router.get('/forecast', enhancedAIController.generateForecast.bind(enhancedAIController));

// Perform comprehensive health check
router.get('/health-check', enhancedAIController.performHealthCheck.bind(enhancedAIController));

// ===== Quick Actions =====

// Get available quick actions
router.get('/quick-actions', enhancedAIController.getQuickActions.bind(enhancedAIController));

// ===== AI Capabilities =====

// Get AI capabilities overview
router.get('/capabilities', enhancedAIController.getAICapabilities.bind(enhancedAIController));

// Get AI status and health
router.get('/status', enhancedAIController.getAIStatus.bind(enhancedAIController));

export default router;
