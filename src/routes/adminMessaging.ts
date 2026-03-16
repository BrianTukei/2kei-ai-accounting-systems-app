// Admin Messaging Routes - Complete Implementation
// Professional message generation and management for 2K AI Accounting Systems

import { Router } from 'express';
import { adminMessagingController } from '../controllers/adminMessagingController';

const router = Router();

// ===== Message Generation =====

// Generate messages for a topic
router.post('/generate', adminMessagingController.generateMessages.bind(adminMessagingController));

// Generate batch messages for multiple topics
router.post('/generate-batch', adminMessagingController.generateBatchMessages.bind(adminMessagingController));

// Generate personalized message for specific user
router.post('/generate-personalized', adminMessagingController.generatePersonalizedMessage.bind(adminMessagingController));

// ===== Message Templates =====

// Get all message templates
router.get('/templates', adminMessagingController.getTemplates.bind(adminMessagingController));

// Generate message from template
router.post('/generate-from-template', adminMessagingController.generateFromTemplate.bind(adminMessagingController));

// ===== Message Management =====

// Send message immediately
router.post('/send', adminMessagingController.sendMessage.bind(adminMessagingController));

// Schedule message for later
router.post('/schedule', adminMessagingController.scheduleMessage.bind(adminMessagingController));

// Cancel scheduled message
router.delete('/schedule/:messageId', adminMessagingController.cancelScheduledMessage.bind(adminMessagingController));

// ===== Analytics & Insights =====

// Get messaging analytics
router.get('/analytics', adminMessagingController.getAnalytics.bind(adminMessagingController));

// Get messaging insights
router.get('/insights', adminMessagingController.getMessagingInsights.bind(adminMessagingController));

// Get message history
router.get('/history', adminMessagingController.getMessageHistory.bind(adminMessagingController));

// Get specific message performance
router.get('/performance/:messageId', adminMessagingController.getMessagePerformance.bind(adminMessagingController));

// ===== Message Optimization =====

// Optimize message for better engagement
router.post('/optimize', adminMessagingController.optimizeMessage.bind(adminMessagingController));

export default router;
