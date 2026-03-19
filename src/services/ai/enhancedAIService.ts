/**
 * Enhanced AI Service
 * ────────────────────────────────────────────────────────────────────────────
 * Advanced AI service with multi-modal capabilities, context awareness,
 * and intelligent action execution. Integrates with the existing AI modes.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIContext, AIResponse, AIMode, AIAction, AIAlert } from './types';
import { detectMode, getModeSystemContext, getModeConfig } from './modes';
import { actionEngine } from './actionEngine';
import { aiReasoningEngine } from './aiReasoningEngine';
import { contextMemorySystem } from './contextMemorySystem';
import { errorDetection } from './errorDetection';
import { forecasting } from './forecasting';

// ── Enhanced AI Configuration ────────────────────────────────────────────────

interface EnhancedAIConfig {
  enableProactiveInsights: boolean;
  enableMemoryLearning: boolean;
  enableErrorDetection: boolean;
  enableForecasting: boolean;
  maxConversationHistory: number;
  responseTimeout: number;
  confidenceThreshold: number;
}

const DEFAULT_CONFIG: EnhancedAIConfig = {
  enableProactiveInsights: true,
  enableMemoryLearning: true,
  enableErrorDetection: true,
  enableForecasting: true,
  maxConversationHistory: 20,
  responseTimeout: 30000,
  confidenceThreshold: 0.7,
};

// ── Enhanced AI Service Class ─────────────────────────────────────────────────

class EnhancedAIService {
  private config: EnhancedAIConfig;
  private conversationCache = new Map<string, AIMessage[]>();

  constructor(config: Partial<EnhancedAIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main entry point for AI processing
   */
  async processMessage(context: AIContext): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Detect the appropriate AI mode
      const mode = detectMode(context.currentPage, context.message);
      const systemContext = getModeSystemContext(context.currentPage, mode);
      const modeConfig = getModeConfig(context.currentPage);

      // 2. Load conversation history and memory
      const conversationHistory = await this.getConversationHistory(context);
      const contextualMemory = await contextMemorySystem.getContextualMemory(context);

      // 3. Analyze for proactive alerts and errors
      const alerts = await this.generateAlerts(context, mode);

      // 4. Generate AI response with reasoning
      const aiResponse = await this.generateAIResponse({
        ...context,
        mode,
        systemContext,
        conversationHistory,
        contextualMemory,
        alerts,
      });

      // 5. Process any detected actions
      const action = await this.processActions(aiResponse.message, context, mode);

      // 6. Update memory and conversation history
      await this.updateMemory(context, aiResponse, mode);
      await this.updateConversationHistory(context, aiResponse);

      // 7. Return enhanced response
      return {
        ...aiResponse,
        mode,
        action,
        alerts,
        metadata: {
          ...aiResponse.metadata,
          processingTime: Date.now() - startTime,
          confidence: aiResponse.metadata?.confidence || 0.8,
          detectedMode: mode,
          contextualMemoryUsed: contextualMemory.length > 0,
        },
      };
    } catch (error) {
      console.error('Enhanced AI Service Error:', error);
      return this.createErrorResponse(error, context);
    }
  }

  /**
   * Generate AI response with reasoning engine
   */
  private async generateAIResponse(enhancedContext: AIContext & {
    mode: AIMode;
    systemContext: string;
    conversationHistory: AIMessage[];
    contextualMemory: any[];
    alerts: AIAlert[];
  }): Promise<AIResponse> {
    const reasoningPrompt = this.buildReasoningPrompt(enhancedContext);
    
    const reasoning = await aiReasoningEngine.reason({
      prompt: reasoningPrompt,
      context: enhancedContext,
      mode: enhancedContext.mode,
      financialData: enhancedContext.financialSnapshot,
    });

    return {
      success: true,
      message: reasoning.response,
      mode: enhancedContext.mode,
      conversationId: enhancedContext.conversationId,
      metadata: {
        confidence: reasoning.confidence,
        reasoning: reasoning.steps,
        sources: reasoning.sources,
      },
    };
  }

  /**
   * Build comprehensive reasoning prompt
   */
  private buildReasoningPrompt(context: AIContext & {
    mode: AIMode;
    systemContext: string;
    conversationHistory: AIMessage[];
    contextualMemory: any[];
    alerts: AIAlert[];
  }): string {
    const sections = [
      `ROLE: ${context.systemContext}`,
      '',
      'USER CONTEXT:',
      `- Current Page: ${context.currentPage}`,
      `- User Role: ${context.role}`,
      `- Message: "${context.message}"`,
      '',
    ];

    // Add financial snapshot if available
    if (context.financialSnapshot) {
      sections.push('FINANCIAL SNAPSHOT:');
      sections.push(`- Total Balance: $${context.financialSnapshot.totalBalance.toLocaleString()}`);
      sections.push(`- Monthly Income: $${context.financialSnapshot.monthlyIncome.toLocaleString()}`);
      sections.push(`- Monthly Expenses: $${context.financialSnapshot.monthlyExpenses.toLocaleString()}`);
      sections.push(`- Transaction Count: ${context.financialSnapshot.transactionCount}`);
      sections.push('');
    }

    // Add conversation history
    if (context.conversationHistory.length > 0) {
      sections.push('RECENT CONVERSATION:');
      context.conversationHistory.slice(-3).forEach(msg => {
        sections.push(`${msg.role.toUpperCase()}: ${msg.content}`);
      });
      sections.push('');
    }

    // Add contextual memory
    if (context.contextualMemory.length > 0) {
      sections.push('RELEVANT MEMORY:');
      context.contextualMemory.slice(-3).forEach(memory => {
        sections.push(`- ${memory.key}: ${memory.value}`);
      });
      sections.push('');
    }

    // Add alerts if any
    if (context.alerts.length > 0) {
      sections.push('ACTIVE ALERTS:');
      context.alerts.forEach(alert => {
        sections.push(`- ${alert.severity.toUpperCase()}: ${alert.title} - ${alert.message}`);
      });
      sections.push('');
    }

    sections.push('INSTRUCTIONS:');
    sections.push('1. Analyze the user\'s request in the context of their current page and financial situation.');
    sections.push('2. Provide a helpful, accurate response based on your role.');
    sections.push('3. If you detect an actionable request, suggest appropriate actions.');
    sections.push('4. Be proactive in identifying potential issues or opportunities.');
    sections.push('5. Keep responses concise but comprehensive.');

    return sections.join('\n');
  }

  /**
   * Generate proactive alerts based on context
   */
  private async generateAlerts(context: AIContext, mode: AIMode): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];

    if (!this.config.enableErrorDetection) {
      return alerts;
    }

    // Error detection alerts
    if (context.financialSnapshot) {
      const errorAlerts = await errorDetection.scanFinancialData(context.financialSnapshot);
      alerts.push(...errorAlerts);
    }

    // Cash flow alerts
    if (context.financialSnapshot && context.financialSnapshot.totalBalance < 1000) {
      alerts.push({
        severity: 'warning',
        title: 'Low Cash Balance',
        message: 'Your cash balance is running low. Consider reviewing expenses or accelerating collections.',
        category: 'cashflow_risk',
      });
    }

    // Overdue invoice alerts
    if (context.financialSnapshot?.invoiceSummary?.overdueValue > 0) {
      alerts.push({
        severity: 'critical',
        title: 'Overdue Invoices',
        message: `$${context.financialSnapshot.invoiceSummary.overdueValue.toLocaleString()} in overdue invoices need attention.`,
        category: 'overdue_invoice',
      });
    }

    return alerts;
  }

  /**
   * Process and validate actions
   */
  private async processActions(
    message: string,
    context: AIContext,
    mode: AIMode
  ): Promise<AIAction | undefined> {
    // Use the action engine to detect and validate actions
    const detectedAction = await actionEngine.detectAction(message, context, mode);
    
    if (detectedAction && this.shouldExecuteAction(detectedAction, context)) {
      return detectedAction;
    }

    return undefined;
  }

  /**
   * Determine if action should be executed based on context and permissions
   */
  private shouldExecuteAction(action: AIAction, context: AIContext): boolean {
    // Check user role permissions
    if (context.role === 'viewer' && action.requiresConfirmation) {
      return false;
    }

    // Check confidence threshold
    const confidence = action.data.confidence || 0.8;
    if (confidence < this.config.confidenceThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Get conversation history with caching
   */
  private async getConversationHistory(context: AIContext): Promise<AIMessage[]> {
    const cacheKey = context.conversationId || 'default';
    
    if (this.conversationCache.has(cacheKey)) {
      return this.conversationCache.get(cacheKey)!;
    }

    const history = context.conversationHistory || [];
    const limited = history.slice(-this.config.maxConversationHistory);
    
    this.conversationCache.set(cacheKey, limited);
    return limited;
  }

  /**
   * Update memory systems
   */
  private async updateMemory(
    context: AIContext,
    response: AIResponse,
    mode: AIMode
  ): Promise<void> {
    if (!this.config.enableMemoryLearning) {
      return;
    }

    await contextMemorySystem.updateMemory({
      organizationId: context.organizationId || 'default',
      userMessage: context.message,
      aiResponse: response.message,
      mode,
      page: context.currentPage,
      timestamp: new Date(),
    });
  }

  /**
   * Update conversation history
   */
  private async updateConversationHistory(
    context: AIContext,
    response: AIResponse
  ): Promise<void> {
    const cacheKey = context.conversationId || 'default';
    const history = this.conversationCache.get(cacheKey) || [];

    const userMessage: AIMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: context.message,
      timestamp: new Date(),
    };

    const assistantMessage: AIMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      action: response.action,
    };

    const updatedHistory = [...history, userMessage, assistantMessage]
      .slice(-this.config.maxConversationHistory);

    this.conversationCache.set(cacheKey, updatedHistory);
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: any, context: AIContext): AIResponse {
    return {
      success: false,
      message: 'I apologize, but I encountered an error processing your request. Please try again.',
      mode: 'general',
      conversationId: context.conversationId,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Clear conversation cache
   */
  clearCache(conversationId?: string): void {
    if (conversationId) {
      this.conversationCache.delete(conversationId);
    } else {
      this.conversationCache.clear();
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cachedConversations: this.conversationCache.size,
      config: this.config,
    };
  }
}

// ── Export singleton instance ─────────────────────────────────────────────────

export const enhancedAIService = new EnhancedAIService();
export default enhancedAIService;
