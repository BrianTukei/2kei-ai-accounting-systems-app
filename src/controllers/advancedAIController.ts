// Advanced AI Controller - API Integration
// Complete AI SaaS API Controller for 2K AI Accounting Systems

import { Request, Response } from 'express';
import { advancedAIChatInterface, ChatSession, ChatMessage } from '../services/ai/advancedAIChatInterface';
import { contextMemorySystem } from '../services/ai/contextMemorySystem';
import { actionEngine } from '../services/ai/actionEngine';
import { aiReasoningEngine } from '../services/ai/aiReasoningEngine';

export class AdvancedAIController {
  // Chat Endpoints
  async createChatSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      const session = await advancedAIChatInterface.createSession(userId);
      
      res.json({
        success: true,
        data: session,
        message: 'Chat session created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to create chat session'
      });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { sessionId, message } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          error: 'Session ID and message are required'
        });
      }

      // Send typing indicator
      await advancedAIChatInterface.sendTypingIndicator(sessionId, true);

      // Process message
      const aiMessage = await advancedAIChatInterface.sendMessage(sessionId, message);

      // Remove typing indicator
      await advancedAIChatInterface.sendTypingIndicator(sessionId, false);

      res.json({
        success: true,
        data: aiMessage,
        message: 'Message processed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to process message'
      });
    }
  }

  async getChatSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await advancedAIChatInterface.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get chat session'
      });
    }
  }

  async getContextualSuggestions(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const suggestions = await advancedAIChatInterface.getContextualSuggestions(sessionId);
      
      res.json({
        success: true,
        data: suggestions,
        message: 'Suggestions retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get suggestions'
      });
    }
  }

  async exportConversation(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const format = (req.query.format as string) || 'json';
      
      const exportData = await advancedAIChatInterface.exportConversation(sessionId, format as 'json' | 'txt');
      
      if (format === 'txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="conversation.txt"');
        res.send(exportData);
      } else {
        res.json({
          success: true,
          data: exportData,
          message: 'Conversation exported successfully'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to export conversation'
      });
    }
  }

  // AI Reasoning Endpoints
  async analyzeFinancialHealth(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      const context = await contextMemorySystem.buildAIContext(userId);
      
      const analysis = await aiReasoningEngine.analyzeFinancialHealth(context);
      
      res.json({
        success: true,
        data: analysis,
        message: 'Financial health analysis completed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to analyze financial health'
      });
    }
  }

  async detectAnomalies(req: Request, res: Response) {
    try {
      const { transactions } = req.body;
      
      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({
          success: false,
          error: 'Transactions array is required'
        });
      }

      const analysis = await aiReasoningEngine.detectAnomalies(transactions);
      
      res.json({
        success: true,
        data: analysis,
        message: 'Anomaly detection completed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to detect anomalies'
      });
    }
  }

  async forecastCashflow(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      const context = await contextMemorySystem.buildAIContext(userId);
      
      const forecast = await aiReasoningEngine.forecastCashflow(context);
      
      res.json({
        success: true,
        data: forecast,
        message: 'Cash flow forecast completed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to forecast cash flow'
      });
    }
  }

  async optimizeExpenses(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      const context = await contextMemorySystem.buildAIContext(userId);
      
      const optimization = await aiReasoningEngine.optimizeExpenses(context);
      
      res.json({
        success: true,
        data: optimization,
        message: 'Expense optimization analysis completed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to optimize expenses'
      });
    }
  }

  // Action Engine Endpoints
  async executeAction(req: Request, res: Response) {
    try {
      const { action } = req.body;
      
      if (!action || !action.type) {
        return res.status(400).json({
          success: false,
          error: 'Action object with type is required'
        });
      }

      // Validate action
      const isValid = await actionEngine.validateAction(action);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action parameters'
        });
      }

      const result = await actionEngine.executeAction(action);
      
      res.json({
        success: true,
        data: result,
        message: 'Action executed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to execute action'
      });
    }
  }

  async executeBatchActions(req: Request, res: Response) {
    try {
      const { actions } = req.body;
      
      if (!actions || !Array.isArray(actions)) {
        return res.status(400).json({
          success: false,
          error: 'Actions array is required'
        });
      }

      const results = await actionEngine.executeBatchActions(actions);
      
      res.json({
        success: true,
        data: results,
        message: 'Batch actions executed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to execute batch actions'
      });
    }
  }

  async getActionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.query.userId || 'demo-user';
      const { limit = '50' } = req.query;
      
      const history = await actionEngine.getActionHistory(userId as string, Number(limit));
      
      res.json({
        success: true,
        data: history,
        message: 'Action history retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get action history'
      });
    }
  }

  // Memory System Endpoints
  async updateUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      const profileData = req.body;
      
      await contextMemorySystem.updateUserProfile(userId, profileData);
      
      res.json({
        success: true,
        message: 'User profile updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to update user profile'
      });
    }
  }

  async getUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id || (req.query.userId as string) || 'demo-user';
      
      const profile = await contextMemorySystem.getUserProfile(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get user profile'
      });
    }
  }

  async updateFinancialMetrics(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      const metricsData = req.body;
      
      await contextMemorySystem.updateFinancialMetrics(userId, metricsData);
      
      res.json({
        success: true,
        message: 'Financial metrics updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to update financial metrics'
      });
    }
  }

  async getFinancialMetrics(req: Request, res: Response) {
    try {
      const userId = req.user?.id || (req.query.userId as string) || 'demo-user';
      
      const metrics = await contextMemorySystem.getFinancialMetrics(userId);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get financial metrics'
      });
    }
  }

  async getMemoryAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id || (req.query.userId as string) || 'demo-user';
      
      const analytics = await contextMemorySystem.getMemoryAnalytics(userId);
      
      res.json({
        success: true,
        data: analytics,
        message: 'Memory analytics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get memory analytics'
      });
    }
  }

  // RAG (Retrieval Augmented Generation) Endpoints
  async searchBusinessData(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const results = await advancedAIChatInterface.searchBusinessData(userId, query);
      
      res.json({
        success: true,
        data: results,
        message: 'Business data search completed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to search business data'
      });
    }
  }

  async getSessionAnalytics(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      
      const analytics = await advancedAIChatInterface.getSessionAnalytics(sessionId);
      
      res.json({
        success: true,
        data: analytics,
        message: 'Session analytics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get session analytics'
      });
    }
  }

  // Advanced Features
  async generateQuickActions(req: Request, res: Response) {
    try {
      const userId = req.user?.id || (req.query.userId as string) || 'demo-user';
      
      const quickActions = await advancedAIChatInterface.generateQuickActions(userId);
      
      res.json({
        success: true,
        data: quickActions,
        message: 'Quick actions generated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to generate quick actions'
      });
    }
  }

  async startRealTimeSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId || 'demo-user';
      
      const session = await advancedAIChatInterface.startRealTimeSession(userId);
      
      res.json({
        success: true,
        data: session,
        message: 'Real-time session started successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to start real-time session'
      });
    }
  }

  async handleVoiceMessage(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
      }

      // Handle voice message (would need audio file upload)
      // For now, return a mock response
      const voiceMessage: ChatMessage = {
        id: 'voice_' + Date.now(),
        role: 'assistant',
        content: 'Voice message processing is coming soon! For now, please use text messages.',
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: voiceMessage,
        message: 'Voice message processed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to process voice message'
      });
    }
  }

  async clearSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      
      await advancedAIChatInterface.clearSession(sessionId);
      
      res.json({
        success: true,
        message: 'Session cleared successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to clear session'
      });
    }
  }

  async deleteSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      
      await advancedAIChatInterface.deleteSession(sessionId);
      
      res.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete session'
      });
    }
  }
}

export const advancedAIController = new AdvancedAIController();
