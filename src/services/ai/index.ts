/**
 * ai/index.ts — Barrel export for the 2KEI Financial Intelligence Engine
 */

// Core engine
export { AIEngine, default } from './aiEngine';

// Types
export type {
  AIContext, AIResponse, AIAction, AIActionType, AIMode,
  AIAlert, AIMessage, AIMemoryEntry, AIRoleConfig,
  FinancialSnapshot, ForecastResult, ExpenseClassification,
} from './types';

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
