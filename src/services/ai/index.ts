/**
 * ai/index.ts — Barrel export for the 2KEI Financial Intelligence Engine
 */

// Core engine
export { AIEngine, default } from './aiEngine';

// Enhanced services
export { enhancedAIService, default as enhancedAI } from './enhancedAIService';
export { intelligentReceiptScanner, default as receiptScanner } from './intelligentReceiptScanner';
export { financialInsightsEngine, default as insightsEngine } from './financialInsightsEngine';
export { advancedReasoningEngine, default as reasoningEngine } from './advancedReasoningEngine';
export { workflowEngine, default as workflowAutomation } from './workflowAutomation';
export { aiServiceManager, default as aiManager } from './aiServiceManager';

// Types
export type {
  AIContext, AIResponse, AIAction, AIActionType, AIMode,
  AIAlert, AIMessage, AIMemoryEntry, AIRoleConfig,
  FinancialSnapshot, ForecastResult, ExpenseClassification,
} from './types';

// Receipt scanner types
export type {
  ReceiptData, ReceiptItem, ReceiptMetadata, ScanResult,
} from './intelligentReceiptScanner';

// Insights types
export type {
  FinancialInsight, InsightType, InsightCategory, InsightData,
  InsightReport, TrendAnalysis, PriorityRecommendation,
} from './financialInsightsEngine';

// Reasoning engine types
export type {
  ReasoningStep, ReasoningChain, FinancialAnalysis, BusinessInsight,
} from './advancedReasoningEngine';

// Workflow automation types
export type {
  WorkflowDefinition, WorkflowTrigger, WorkflowStep, WorkflowExecution,
  WorkflowContext, WorkflowResult, WorkflowCondition, StepCondition,
} from './workflowAutomation';

// Sub-modules (for direct access when needed)
export { detectAction, buildActionResponse, executeAction } from './actionHandler';
export { analyzeFinancials, generateAnalysisSummary, generateComparisonInsight } from './analysis';
export { generateForecast, generateForecastResponse } from './forecasting';
export { classifyExpense, isExpenseEntry, generateClassificationResponse } from './expenseClassifier';
export { generateCoachingResponse } from './businessCoach';
export { detectErrors, generateErrorDetectionResponse } from './errorDetection';
export { detectMode, getModeConfig, getModeLabel } from './modes';
export { getRoleConfig, canExecuteAction, adaptResponseForRole } from './roles';
export {
  rememberQuestion, rememberAction, rememberPattern,
  rememberPreference, getFrequentQuestions, getFrequentActions,
  buildMemoryContext, clearMemory,
} from './memory';
export { isOffTopic, hasRealData, logAction, validateAction } from './safety';
