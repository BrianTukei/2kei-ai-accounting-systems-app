// Autonomous Bookkeeping Routes - Complete Implementation
// Revolutionary self-running accounting system for 2K AI Accounting Systems

import { Router } from 'express';
import { autonomousBookkeepingController } from '../controllers/autonomousBookkeepingController';

const router = Router();

// ===== Core Automation Modules =====

// 1️⃣ AI Transaction Analyzer
router.post('/analyze-transaction', autonomousBookkeepingController.analyzeTransaction.bind(autonomousBookkeepingController));

// 2️⃣ AI Smart Categorization
router.post('/categorize-transaction', autonomousBookkeepingController.smartCategorizeTransaction.bind(autonomousBookkeepingController));

// 3️⃣ AI Duplicate Detection
router.post('/detect-duplicate', autonomousBookkeepingController.detectDuplicate.bind(autonomousBookkeepingController));

// 4️⃣ AI Financial Health Monitor
router.get('/analyze-financial-health', autonomousBookkeepingController.analyzeFinancialHealth.bind(autonomousBookkeepingController));

// 5️⃣ AI Cashflow Predictor
router.get('/predict-cashflow', autonomousBookkeepingController.predictCashflow.bind(autonomousBookkeepingController));

// ===== Autonomous Workflows =====

// Autonomous Receipt Processing
router.post('/process-receipt', autonomousBookkeepingController.processReceiptAutonomously.bind(autonomousBookkeepingController));

// Autonomous Bookkeeping Orchestrator
router.post('/run-autonomous', autonomousBookkeepingController.runAutonomousBookkeeping.bind(autonomousBookkeepingController));

// Batch Transaction Processing
router.post('/process-batch', autonomousBookkeepingController.processBatchTransactions.bind(autonomousBookkeepingController));

// ===== Management & Monitoring =====

// Get autonomous status
router.get('/status', autonomousBookkeepingController.getAutonomousStatus.bind(autonomousBookkeepingController));

// Get financial summary (AI-generated)
router.get('/financial-summary', autonomousBookkeepingController.getFinancialSummary.bind(autonomousBookkeepingController));

// Schedule autonomous bookkeeping
router.post('/schedule', autonomousBookkeepingController.scheduleAutonomousBookkeeping.bind(autonomousBookkeepingController));

// Get autonomous bookkeeping history
router.get('/history', autonomousBookkeepingController.getAutonomousHistory.bind(autonomousBookkeepingController));

// ===== Configuration & Reference =====

// Get category mappings
router.get('/category-mappings', autonomousBookkeepingController.getCategoryMappings.bind(autonomousBookkeepingController));

export default router;
