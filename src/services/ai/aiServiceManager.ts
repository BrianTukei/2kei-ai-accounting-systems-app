/**
 * AI Service Manager
 * ────────────────────────────────────────────────────────────────────────────
 * Central orchestration layer that coordinates all AI services,
 * manages their lifecycle, and provides unified access to AI capabilities.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIContext, AIResponse, FinancialSnapshot } from './types';
import { enhancedAIService } from './enhancedAIService';
import { intelligentReceiptScanner } from './intelligentReceiptScanner';
import { financialInsightsEngine } from './financialInsightsEngine';
import { advancedReasoningEngine } from './advancedReasoningEngine';
import { workflowEngine } from './workflowAutomation';
import { detectMode } from './modes';

// ── Service Manager Types ─────────────────────────────────────────────────────

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  uptime: number;
  capabilities: string[];
}

export interface AIServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByService: Record<string, number>;
  errorsByService: Record<string, number>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

export interface ServiceHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  uptime: number;
  lastRestart: Date;
  version: string;
}

export interface UnifiedAIRequest {
  type: 'chat' | 'analysis' | 'receipt_scan' | 'insights' | 'workflow' | 'reasoning';
  context: AIContext;
  data?: any;
  options?: {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    timeout?: number;
    retries?: number;
    useCache?: boolean;
  };
}

export interface UnifiedAIResponse {
  success: boolean;
  type: string;
  data: any;
  metadata: {
    processingTime: number;
    service: string;
    confidence: number;
    requestId: string;
    cached: boolean;
  };
  error?: string;
}

// ── AI Service Manager Class ─────────────────────────────────────────────────

class AIServiceManager {
  private services = new Map<string, any>();
  private metrics: AIServiceMetrics;
  private healthStatus: ServiceHealth;
  private requestQueue: UnifiedAIRequest[] = [];
  private isProcessing = false;
  private cache = new Map<string, any>();
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.metrics = this.initializeMetrics();
    this.healthStatus = this.initializeHealth();
    this.initializeServices();
  }

  private initializeMetrics(): AIServiceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByService: {},
      errorsByService: {},
      topEndpoints: []
    };
  }

  private initializeHealth(): ServiceHealth {
    return {
      overall: 'healthy',
      services: [],
      uptime: 0,
      lastRestart: this.startTime,
      version: '1.0.0'
    };
  }

  private initializeServices(): void {
    // Register all AI services
    this.services.set('enhanced_ai', enhancedAIService);
    this.services.set('receipt_scanner', intelligentReceiptScanner);
    this.services.set('insights_engine', financialInsightsEngine);
    this.services.set('reasoning_engine', advancedReasoningEngine);
    this.services.set('workflow_engine', workflowEngine);

    // Initialize service status
    this.healthStatus.services = Array.from(this.services.keys()).map(name => ({
      name,
      status: 'healthy' as const,
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      uptime: 0,
      capabilities: this.getServiceCapabilities(name) as string[]
    }));
  }

  getServiceCapabilities(serviceName?: string): string[] | Record<string, string[]> {
    if (serviceName) {
      const service = this.healthStatus.services.find(s => s.name === serviceName);
      return service?.capabilities || [];
    }

    const allCapabilities: Record<string, string[]> = {};
    this.healthStatus.services.forEach(service => {
      allCapabilities[service.name] = service.capabilities;
    });
    return allCapabilities;
  }

  /**
   * Main entry point for all AI requests
   */
  async processRequest(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.metrics.totalRequests++;
      
      // Check cache if enabled
      if (request.options?.useCache) {
        const cached = this.getFromCache(request);
        if (cached) {
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cached: true,
              requestId
            }
          };
        }
      }

      // Route to appropriate service
      const response = await this.routeRequest(request, requestId);
      
      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(response.metadata.service, processingTime, true);

      // Cache response if enabled
      if (request.options?.useCache) {
        this.setCache(request, response);
      }

      return {
        ...response,
        metadata: {
          ...response.metadata,
          processingTime,
          requestId,
          cached: false
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics('unknown', processingTime, false);

      return {
        success: false,
        type: request.type,
        data: null,
        metadata: {
          processingTime,
          service: 'unknown',
          confidence: 0,
          requestId,
          cached: false
        },
        error: error.message
      };
    }
  }

  /**
   * Route request to appropriate service
   */
  private async routeRequest(request: UnifiedAIRequest, requestId: string): Promise<UnifiedAIResponse> {
    switch (request.type) {
      case 'chat':
        return await this.handleChatRequest(request, requestId);
      
      case 'receipt_scan':
        return await this.handleReceiptScanRequest(request, requestId);
      
      case 'insights':
        return await this.handleInsightsRequest(request, requestId);
      
      case 'reasoning':
        return await this.handleReasoningRequest(request, requestId);
      
      case 'workflow':
        return await this.handleWorkflowRequest(request, requestId);
      
      case 'analysis':
        return await this.handleAnalysisRequest(request, requestId);
      
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  private async handleChatRequest(request: UnifiedAIRequest, requestId: string): Promise<UnifiedAIResponse> {
    const service = this.services.get('enhanced_ai');
    const response = await service.processMessage(request.context);

    return {
      success: response.success,
      type: 'chat',
      data: response,
      metadata: {
        processingTime: 0, // Will be set by caller
        service: 'enhanced_ai',
        confidence: response.metadata?.confidence || 0.8,
        requestId,
        cached: false
      }
    };
  }

  private async handleReceiptScanRequest(request: UnifiedAIRequest, requestId: string): Promise<UnifiedAIResponse> {
    const service = this.services.get('receipt_scanner');
    const response = await service.scanReceipt(request.data.file);

    return {
      success: response.success,
      type: 'receipt_scan',
      data: response,
      metadata: {
        processingTime: 0,
        service: 'receipt_scanner',
        confidence: response.receipt?.confidence || 0.8,
        requestId,
        cached: false
      }
    };
  }

  private async handleInsightsRequest(request: UnifiedAIRequest, requestId: string): Promise<UnifiedAIResponse> {
    const service = this.services.get('insights_engine');
    const response = await service.generateInsights(request.data.financialSnapshot);

    return {
      success: true,
      type: 'insights',
      data: response,
      metadata: {
        processingTime: 0,
        service: 'insights_engine',
        confidence: 0.9,
        requestId,
        cached: false
      }
    };
  }

  private async handleReasoningRequest(request: UnifiedAIRequest, requestId: string): Promise<UnifiedAIResponse> {
    const service = this.services.get('reasoning_engine');
    const response = await service.reason(request.context);

    return {
      success: true,
      type: 'reasoning',
      data: response,
      metadata: {
        processingTime: 0,
        service: 'reasoning_engine',
        confidence: response.confidence,
        requestId,
        cached: false
      }
    };
  }

  private async handleWorkflowRequest(request: UnifiedAIRequest, requestId: string): Promise<UnifiedAIResponse> {
    const service = this.services.get('workflow_engine');
    const response = await service.executeWorkflow(
      request.data.workflowId,
      request.data.context,
      request.data.triggerData
    );

    return {
      success: true,
      type: 'workflow',
      data: response,
      metadata: {
        processingTime: 0,
        service: 'workflow_engine',
        confidence: 0.9,
        requestId,
        cached: false
      }
    };
  }

  private async handleAnalysisRequest(request: UnifiedAIRequest, requestId: string): Promise<UnifiedAIResponse> {
    // Combine insights and reasoning for comprehensive analysis
    const insightsPromise = this.handleInsightsRequest(request, requestId);
    const reasoningPromise = this.handleReasoningRequest(request, requestId);

    const [insights, reasoning] = await Promise.all([insightsPromise, reasoningPromise]);

    return {
      success: insights.success && reasoning.success,
      type: 'analysis',
      data: {
        insights: insights.data,
        reasoning: reasoning.data,
        mode: detectMode(request.context.currentPage, request.context.message)
      },
      metadata: {
        processingTime: 0,
        service: 'combined',
        confidence: (insights.metadata.confidence + reasoning.metadata.confidence) / 2,
        requestId,
        cached: false
      }
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<ServiceHealth> {
    const now = Date.now();
    this.healthStatus.uptime = now - this.startTime.getTime();

    // Check each service
    for (const serviceStatus of this.healthStatus.services) {
      try {
        const startTime = Date.now();
        await this.pingService(serviceStatus.name);
        serviceStatus.responseTime = Date.now() - startTime;
        serviceStatus.status = 'healthy';
        serviceStatus.lastCheck = new Date();
      } catch (error) {
        serviceStatus.status = 'unhealthy';
        serviceStatus.errorCount++;
        serviceStatus.lastCheck = new Date();
      }
    }

    // Determine overall health
    const unhealthyServices = this.healthStatus.services.filter(s => s.status === 'unhealthy');
    const degradedServices = this.healthStatus.services.filter(s => s.status === 'degraded');

    if (unhealthyServices.length > 0) {
      this.healthStatus.overall = 'unhealthy';
    } else if (degradedServices.length > 0) {
      this.healthStatus.overall = 'degraded';
    } else {
      this.healthStatus.overall = 'healthy';
    }

    return this.healthStatus;
  }

  /**
   * Get service metrics
   */
  getMetrics(): AIServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached response
   */
  private getFromCache(request: UnifiedAIRequest): UnifiedAIResponse | null {
    const key = this.generateCacheKey(request);
    return this.cache.get(key) || null;
  }

  /**
   * Set cache response
   */
  private setCache(request: UnifiedAIRequest, response: UnifiedAIResponse): void {
    const key = this.generateCacheKey(request);
    this.cache.set(key, response);
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  private generateCacheKey(request: UnifiedAIRequest): string {
    const keyData = {
      type: request.type,
      context: {
        message: request.context.message,
        currentPage: request.context.currentPage,
        role: request.context.role
      }
    };
    return btoa(JSON.stringify(keyData));
  }

  private async pingService(serviceName: string): Promise<void> {
    // Mock health check - in production, this would ping actual services
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    // Simulate service ping
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private updateMetrics(serviceName: string, responseTime: number, success: boolean): void {
    // Update request counts
    this.metrics.requestsByService[serviceName] = (this.metrics.requestsByService[serviceName] || 0) + 1;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      this.metrics.errorsByService[serviceName] = (this.metrics.errorsByService[serviceName] || 0) + 1;
    }

    // Update average response time
    const totalRequests = this.metrics.totalRequests;
    const currentAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    uptime: number;
  } {
    const healthyServices = this.healthStatus.services.filter(s => s.status === 'healthy').length;
    const unhealthyServices = this.healthStatus.services.filter(s => s.status === 'unhealthy').length;
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;

    return {
      totalServices: this.healthStatus.services.length,
      healthyServices,
      unhealthyServices,
      totalRequests: this.metrics.totalRequests,
      successRate,
      averageResponseTime: this.metrics.averageResponseTime,
      uptime: Date.now() - this.startTime.getTime()
    };
  }
}

// ── Export singleton instance ─────────────────────────────────────────────────

export const aiServiceManager = new AIServiceManager();
export default aiServiceManager;
