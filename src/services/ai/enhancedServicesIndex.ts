/**
 * Enhanced AI Services Index
 * ────────────────────────────────────────────────────────────────────────────
 * Central export point for all super-intelligent AI services
 * ────────────────────────────────────────────────────────────────────────────
 */

// Core Enhanced Services
export { enhancedAICore } from './enhancedAICore';
export type { 
  AIMemoryContext, 
  ChainOfThoughtStep, 
  EnhancedAIResponse,
  FinancialInsight 
} from './enhancedAICore';

export { advancedInvoiceService } from './advancedInvoiceService';
export type {
  AdvancedInvoice,
  InvoiceLineItem,
  InvoicePaymentTerms,
  InvoiceTaxBreakdown
} from './advancedInvoiceService';

export { advancedReceiptScanner } from './advancedReceiptScanner';
export type {
  AdvancedReceiptData,
  ReceiptItem
} from './advancedReceiptScanner';

export { advancedForecastingEngine } from './advancedForecastingEngine';
export type {
  CashFlowForecast,
  CategoryForecast,
  FinancialDataPoint,
  ForecastPeriod,
  TrendAnalysis
} from './advancedForecastingEngine';

// Existing Services (kept for compatibility)
export { aiServiceManager } from './aiServiceManager';
export { actionAIService } from './actionAIService';
export { enhancedAIService } from './enhancedAIService';
export { aiAccountantService } from './aiAccountantService';
export { businessCoach } from './businessCoach';
export { financialInsightsEngine } from './financialInsightsEngine';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * // Create enhanced AI session
 * import { enhancedAICore } from './services/ai';
 * const context = enhancedAICore.createMemoryContext('user-123');
 * const response = await enhancedAICore.processUserQuery('user-123', 'Generate invoice');
 * 
 * // Create advanced invoice
 * import { advancedInvoiceService } from './services/ai';
 * const invoice = advancedInvoiceService.createInvoice({
 *   clientName: 'John Doe',
 *   items: [{ description: 'Service', quantity: 1, unitPrice: 100 }]
 * });
 * 
 * // Scan receipt with advanced AI
 * import { advancedReceiptScanner } from './services/ai';
 * const receipt = await advancedReceiptScanner.scanReceiptImage(imageData);
 * 
 * // Generate financial forecast
 * import { advancedForecastingEngine } from './services/ai';
 * const forecast = advancedForecastingEngine.generateCashFlowForecast(30);
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
