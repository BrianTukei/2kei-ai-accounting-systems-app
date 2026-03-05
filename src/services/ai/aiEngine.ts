/**
 * ai/aiEngine.ts
 * ────────────────────────────────────────────────────────────────────────────
 * 2KEI Financial Intelligence Engine — Central Orchestrator
 *
 * This is the new brain of the AI system. It:
 *   1. Determines AI mode (page-aware + intent-aware)
 *   2. Applies safety checks (off-topic, data validation)
 *   3. Checks role permissions
 *   4. Routes to the appropriate sub-engine
 *   5. Records to memory
 *   6. Returns structured response with optional actions
 *
 * DOES NOT replace aiAssistant.ts — extends it. The existing engine is
 * used as a fallback and for its existing analysis capabilities.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/integrations/supabase/client';
import { findNavPages, buildNavigationAction } from '@/ai/navigationMap';
import { AIAssistantService, type FinancialSnapshot as LegacySnapshot } from '@/services/aiAssistant';
import { formatCurrency } from '@/lib/utils';

import type {
  AIContext, AIResponse, AIAction, AIMode, AIAlert,
  FinancialSnapshot,
} from './types';
import { detectMode, getModeConfig, getModeLabel, getModeSystemContext } from './modes';
import { getRoleConfig, canExecuteAction, adaptResponseForRole, getRoleGreeting, getRoleSystemPrompt } from './roles';
import { isOffTopic, OFF_TOPIC_RESPONSE, hasRealData, noDataResponse, sanitizeResponse, logAction, validateAction } from './safety';
import { detectAction, buildActionResponse, executeAction } from './actionHandler';
import { analyzeFinancials, generateAnalysisSummary, generateComparisonInsight } from './analysis';
import { generateForecastResponse } from './forecasting';
import { isExpenseEntry, generateClassificationResponse } from './expenseClassifier';
import { generateCoachingResponse } from './businessCoach';
import { generateErrorDetectionResponse, detectErrors } from './errorDetection';
import { rememberQuestion, rememberAction, buildMemoryContext } from './memory';

// ── Intent patterns (extended from legacy) ──────────────────────────────────

type EngineIntent =
  | 'action_command'    // detects executable actions
  | 'expense_entry'     // "bought fuel 200"
  | 'analysis'          // deep financial analysis
  | 'forecast'          // forecasting
  | 'coaching'          // business advice
  | 'error_check'       // error detection
  | 'comparison'        // period comparison
  | 'navigation'        // system navigation
  | 'greeting'          // hello
  | 'off_topic'         // unrelated
  | 'legacy';           // fall back to existing aiAssistant engine

function detectEngineIntent(message: string): EngineIntent {
  const lower = message.toLowerCase().trim();

  // Off-topic check first
  if (isOffTopic(message)) return 'off_topic';

  // Greeting
  if (/^(hi|hello|hey|help|good\s*(morning|afternoon|evening))\b/i.test(lower) && lower.split(/\s+/).length <= 4) {
    return 'greeting';
  }

  // Expense entry (e.g., "bought fuel 200")
  if (isExpenseEntry(message)) return 'expense_entry';

  // Action commands (must check before analysis since "create invoice" contains "invoice")
  if (/(?:create|make|generate|send|new)\s+(?:an?\s+)?invoice/i.test(lower)) return 'action_command';
  if (/(?:add|create|hire|register)\s+(?:new\s+)?(?:employee|staff)/i.test(lower)) return 'action_command';
  if (/(?:record|add|log)\s+(?:an?\s+)?(?:expense|income|transaction)/i.test(lower)) return 'action_command';
  if (/(?:generate|create|make)\s+(?:a\s+)?(?:report|statement)/i.test(lower)) return 'action_command';
  if (/(?:invite|add)\s+(?:an?\s+)?(?:team|member|accountant|manager|user)/i.test(lower)) return 'action_command';
  if (/(?:create|add|make|record)\s+(?:a\s+)?journal/i.test(lower)) return 'action_command';

  // Forecasting
  if (/forecast|predict|project|runway|burn\s*rate|how\s*long.*cash.*last/i.test(lower)) return 'forecast';

  // Error detection
  if (/(?:error|duplicate|missing|unbalanced|anomal|wrong|check.*(?:entry|data|error)|scan|detect|find.*(?:error|issue|problem))/i.test(lower)) return 'error_check';

  // Coaching
  if (/(?:coach|advic?e|strateg|improv|optimi[sz]|grow|save\s*money|cut\s*cost|increase\s*profit|reduce.*(?:cost|expense))/i.test(lower)) return 'coaching';

  // Comparison
  if (/(?:compar|vs|versus|month\s*over\s*month|change.*(?:since|from)|what.*changed)/i.test(lower)) return 'comparison';

  // Navigation
  if (/(?:where|navigate|go\s*to|take\s*me|how\s*do\s*i\s*(?:find|access|open|get\s*to))/i.test(lower)) return 'navigation';

  // Deep analysis (explicit requests)
  if (/(?:analy[sz]|intelligence\s*report|deep\s*dive|full\s*report|comprehensive)/i.test(lower)) return 'analysis';

  // Default to legacy engine for everything else (health score, exec summary, profit, etc.)
  return 'legacy';
}

// ── Main engine ─────────────────────────────────────────────────────────────

export class AIEngine {
  /**
   * Process a message through the Financial Intelligence Engine.
   * This is the new primary entry point for AI interactions.
   */
  static async processMessage(ctx: AIContext): Promise<AIResponse> {
    const startTime = Date.now();

    // 1. Safety: off-topic guard
    if (isOffTopic(ctx.message)) {
      return {
        success: true,
        message: OFF_TOPIC_RESPONSE,
        mode: 'general',
      };
    }

    // 2. Detect mode and intent
    const mode = detectMode(ctx.currentPage, ctx.message);
    const intent = detectEngineIntent(ctx.message);
    const roleConfig = getRoleConfig(ctx.role);

    // 3. Memory: record this question
    if (ctx.organizationId) {
      rememberQuestion(ctx.organizationId, ctx.message, intent);
    }

    // 4. Route to appropriate engine
    let response: AIResponse;

    try {
      switch (intent) {
        case 'off_topic':
          response = {
            success: true,
            message: OFF_TOPIC_RESPONSE,
            mode: 'general',
          };
          break;

        case 'greeting':
          response = this.handleGreeting(ctx, mode);
          break;

        case 'action_command':
          response = await this.handleAction(ctx, mode);
          break;

        case 'expense_entry':
          response = this.handleExpenseEntry(ctx, mode);
          break;

        case 'forecast':
          response = this.handleForecast(ctx, mode);
          break;

        case 'error_check':
          response = this.handleErrorCheck(ctx, mode);
          break;

        case 'coaching':
          response = this.handleCoaching(ctx, mode);
          break;

        case 'comparison':
          response = this.handleComparison(ctx, mode);
          break;

        case 'analysis':
          response = this.handleAnalysis(ctx, mode);
          break;

        case 'navigation':
          response = this.handleNavigation(ctx, mode);
          break;

        case 'legacy':
        default:
          response = await this.handleLegacy(ctx, mode);
          break;
      }
    } catch (error: any) {
      console.error('[2KEI Engine] Error:', error);
      response = {
        success: true,
        message: `I encountered an issue processing your request. Let me try a simpler analysis.\n\n${error.message || 'Unknown error'}`,
        mode,
      };
    }

    // 5. Apply role adaptation
    response.message = adaptResponseForRole(response.message, ctx.role);

    // 6. Sanitize (no fabricated data)
    response.message = sanitizeResponse(response.message, hasRealData(ctx.financialSnapshot));

    // 7. Add mode label
    response.mode = mode;

    // 8. Add proactive alerts
    if (hasRealData(ctx.financialSnapshot)) {
      const alerts = detectErrors(ctx.financialSnapshot!);
      if (alerts.length > 0 && intent !== 'error_check') {
        response.alerts = alerts;
      }
    }

    // 9. Metadata
    response.metadata = {
      ...response.metadata,
      processingTime: Date.now() - startTime,
      intent,
      mode,
      modeLabel: getModeLabel(mode),
      role: ctx.role,
    };

    return response;
  }

  // ── Handler: Greeting ───────────────────────────────────────────────────

  private static handleGreeting(ctx: AIContext, mode: AIMode): AIResponse {
    const name = ctx.userName?.split(' ')[0] || '';
    const modeConfig = getModeConfig(ctx.currentPage);
    const hasData = hasRealData(ctx.financialSnapshot);

    let message = `Hello${name ? `, ${name}` : ''}! I'm **2KEI AI** — your Financial Intelligence Engine. 🧠\n\n`;
    message += `Currently in **${modeConfig.label}** mode.\n\n`;
    message += `I can:\n`;
    message += `• 🤖 **Execute actions** — "Create invoice for John $500"\n`;
    message += `• 📊 **Analyze finances** — "How is my business doing?"\n`;
    message += `• 📈 **Forecast** — "What's my 3-month forecast?"\n`;
    message += `• 🧾 **Classify expenses** — "Bought fuel 200"\n`;
    message += `• 🎯 **Coach your business** — "How can I cut costs?"\n`;
    message += `• 🔍 **Detect errors** — "Check for anomalies"\n`;
    message += `• 🧭 **Navigate** — "Where do I add a transaction?"\n\n`;

    if (hasData) {
      const analysis = analyzeFinancials(ctx.financialSnapshot!);
      const alertCount = analysis.alerts.filter(a => a.severity !== 'info').length;
      message += `**Quick Status:** ${analysis.profitability.rating === 'excellent' ? '🟢' : analysis.profitability.rating === 'good' ? '🟡' : analysis.profitability.rating === 'thin' ? '🟠' : '🔴'} `;
      message += `Margin: ${analysis.profitability.netMargin.toFixed(1)}% | `;
      message += `Cash: ${formatCurrency(analysis.cashflow.balance)} | `;
      message += `Alerts: ${alertCount > 0 ? `⚠️ ${alertCount}` : '✅ None'}`;
    } else {
      message += `Start recording transactions to unlock AI-powered insights!`;
    }

    return { success: true, message, mode };
  }

  // ── Handler: Action Command ─────────────────────────────────────────────

  private static async handleAction(ctx: AIContext, mode: AIMode): Promise<AIResponse> {
    const action = detectAction(ctx.message);

    if (!action) {
      return {
        success: true,
        message: `I detected you want to perform an action, but I couldn't parse the details. Try:\n\n• "Create invoice for [client] $[amount]"\n• "Record expense [description] [amount]"\n• "Add employee [name] salary [amount]"\n• "Invite accountant [email]"\n• "Generate profit report"`,
        mode: 'action_executor',
      };
    }

    // Check permission
    if (!canExecuteAction(ctx.role, action.type)) {
      return {
        success: true,
        message: `I detected: **${action.description}**\n\n❌ Your role (**${ctx.role}**) doesn't have permission for this action. Contact your organization owner.`,
        mode: 'action_executor',
        action: { ...action, requiresConfirmation: false },
      };
    }

    // Memory
    if (ctx.organizationId) {
      rememberAction(ctx.organizationId, action.type, action.data);
    }

    const message = buildActionResponse(action, ctx);
    return {
      success: true,
      message,
      mode: 'action_executor',
      action,
    };
  }

  // ── Handler: Expense Entry ──────────────────────────────────────────────

  private static handleExpenseEntry(ctx: AIContext, mode: AIMode): AIResponse {
    const classificationMsg = generateClassificationResponse(ctx.message);

    // Also create an action for it
    const action = detectAction(ctx.message);

    return {
      success: true,
      message: classificationMsg,
      mode: 'expense_classifier',
      action: action || undefined,
    };
  }

  // ── Handler: Forecast ───────────────────────────────────────────────────

  private static handleForecast(ctx: AIContext, mode: AIMode): AIResponse {
    if (!hasRealData(ctx.financialSnapshot)) {
      return {
        success: true,
        message: noDataResponse(ctx.userName),
        mode: 'forecaster',
      };
    }

    const message = generateForecastResponse(ctx.financialSnapshot!);
    return { success: true, message, mode: 'forecaster' };
  }

  // ── Handler: Error Check ────────────────────────────────────────────────

  private static handleErrorCheck(ctx: AIContext, mode: AIMode): AIResponse {
    if (!hasRealData(ctx.financialSnapshot)) {
      return {
        success: true,
        message: noDataResponse(ctx.userName),
        mode: 'error_detector',
      };
    }

    const message = generateErrorDetectionResponse(ctx.financialSnapshot!);
    return { success: true, message, mode: 'error_detector' };
  }

  // ── Handler: Business Coaching ──────────────────────────────────────────

  private static handleCoaching(ctx: AIContext, mode: AIMode): AIResponse {
    if (!hasRealData(ctx.financialSnapshot)) {
      return {
        success: true,
        message: noDataResponse(ctx.userName),
        mode: 'business_coach',
      };
    }

    const message = generateCoachingResponse(ctx.message, ctx.financialSnapshot!);
    return { success: true, message, mode: 'business_coach' };
  }

  // ── Handler: Comparison ─────────────────────────────────────────────────

  private static handleComparison(ctx: AIContext, mode: AIMode): AIResponse {
    if (!hasRealData(ctx.financialSnapshot)) {
      return {
        success: true,
        message: noDataResponse(ctx.userName),
        mode: 'financial_analyst',
      };
    }

    const message = generateComparisonInsight(ctx.financialSnapshot!);
    return { success: true, message, mode: 'financial_analyst' };
  }

  // ── Handler: Deep Analysis ──────────────────────────────────────────────

  private static handleAnalysis(ctx: AIContext, mode: AIMode): AIResponse {
    if (!hasRealData(ctx.financialSnapshot)) {
      return {
        success: true,
        message: noDataResponse(ctx.userName),
        mode: 'financial_analyst',
      };
    }

    const analysis = analyzeFinancials(ctx.financialSnapshot!);
    const message = generateAnalysisSummary(analysis);
    return {
      success: true,
      message,
      mode: 'financial_analyst',
      alerts: analysis.alerts,
    };
  }

  // ── Handler: Navigation ─────────────────────────────────────────────────

  private static handleNavigation(ctx: AIContext, mode: AIMode): AIResponse {
    const pages = findNavPages(ctx.message);

    if (pages.length === 0) {
      return {
        success: true,
        message: `I couldn't find a matching page. Try asking:\n• "Where do I add a transaction?"\n• "Take me to invoices"\n• "How do I create a report?"`,
        mode: 'navigator',
      };
    }

    const bestMatch = pages[0];
    const navAction = buildNavigationAction(bestMatch);
    let message = `## 🧭 Navigation Guide\n\n`;
    message += `**${bestMatch.name}**\n\n`;
    message += `**Steps:**\n`;
    bestMatch.steps.forEach((step, i) => {
      message += `${i + 1}. ${step}\n`;
    });

    if (navAction) {
      message += `\n<!--NAV_ACTION:${JSON.stringify(navAction)}-->`;
    }

    if (pages.length > 1) {
      message += `\n\n**Other matches:** ${pages.slice(1, 4).map(p => p.name).join(', ')}`;
    }

    return {
      success: true,
      message,
      mode: 'navigator',
    };
  }

  // ── Handler: Legacy (falls back to existing aiAssistant.ts engine) ────

  private static async handleLegacy(ctx: AIContext, mode: AIMode): Promise<AIResponse> {
    const legacyResponse = await AIAssistantService.sendMessage({
      message: ctx.message,
      conversationId: ctx.conversationId,
      contextType: ctx.contextType,
      contextData: ctx.contextData,
      financialSnapshot: ctx.financialSnapshot as LegacySnapshot,
      userName: ctx.userName,
    });

    return {
      success: legacyResponse.success,
      message: legacyResponse.response || 'I couldn\'t generate a response. Please try again.',
      mode,
      conversationId: legacyResponse.conversationId,
    };
  }

  // ── Execute action (public, called from frontend on confirmation) ─────

  static async executeConfirmedAction(action: AIAction, ctx: AIContext): Promise<AIResponse> {
    const result = await executeAction(action, ctx, supabase);

    return {
      success: result.success,
      message: result.message,
      mode: 'action_executor',
      action: { ...action, executed: true, result },
    };
  }

  // ── Get proactive alerts (called on page load) ─────────────────────────

  static getProactiveAlerts(snap: FinancialSnapshot): AIAlert[] {
    if (!hasRealData(snap)) return [];
    return detectErrors(snap);
  }

  // ── Get mode info for current page ─────────────────────────────────────

  static getModeInfo(currentPage: string) {
    return getModeConfig(currentPage);
  }
}

export default AIEngine;
