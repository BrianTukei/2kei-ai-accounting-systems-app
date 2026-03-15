import { Request, Response } from 'express';
import { actionAIService, AIAction, ActionResult } from '../services/ai/actionAIService';

export class ActionAIController {
  /**
   * POST /api/action-ai/process
   * Process user message and determine if it's an action
   */
  static async processMessage(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { message, context } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (message.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      if (message.length > 2000) {
        return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
      }

      // Process the message with Action AI
      const result = await actionAIService.processUserMessage(
        message,
        req.user.id,
        req.user.companyId,
        context
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Process message error:', error);
      res.status(500).json({ 
        error: 'Failed to process message',
        details: error.message 
      });
    }
  }

  /**
   * POST /api/action-ai/execute
   * Execute a specific action
   */
  static async executeAction(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { action, parameters } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      // Validate action
      const availableActions = actionAIService.getAvailableActions();
      if (!availableActions.includes(action)) {
        return res.status(400).json({ 
          error: 'Invalid action',
          availableActions 
        });
      }

      // Execute the action
      const aiAction: AIAction = {
        action,
        parameters: parameters || {},
        confidence: 1.0
      };

      const result = await actionAIService.executeAction(
        aiAction,
        req.user.id,
        req.user.companyId
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Execute action error:', error);
      res.status(500).json({ 
        error: 'Failed to execute action',
        details: error.message 
      });
    }
  }

  /**
   * POST /api/action-ai/chat
   * Combined chat and action processing
   */
  static async chatWithAction(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { message, context, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Process message to determine if it's an action
      const processResult = await actionAIService.processUserMessage(
        message,
        req.user.id,
        req.user.companyId,
        context
      );

      let actionResult: ActionResult | null = null;
      let finalResponse: string;

      if (processResult.isAction && processResult.action) {
        // Execute the action
        actionResult = await actionAIService.executeAction(
          processResult.action,
          req.user.id,
          req.user.companyId
        );

        if (actionResult.success) {
          finalResponse = actionResult.message || `✅ ${processResult.action.action} completed successfully`;
        } else {
          finalResponse = `❌ Failed to ${processResult.action.action.replace('_', ' ')}: ${actionResult.error}`;
        }
      } else {
        finalResponse = processResult.response || "I'm not sure how to help with that. Please try asking about creating invoices, expenses, or viewing reports.";
      }

      // Log the interaction
      console.log(`Action AI interaction - User: ${req.user.id}, Action: ${processResult.isAction}, Success: ${actionResult?.success}`);

      res.json({
        success: true,
        data: {
          response: finalResponse,
          isAction: processResult.isAction,
          action: processResult.action,
          actionResult,
          confidence: processResult.confidence,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Chat with action error:', error);
      res.status(500).json({ 
        error: 'Failed to process chat with action',
        details: error.message 
      });
    }
  }

  /**
   * GET /api/action-ai/capabilities
   * Get available actions and capabilities
   */
  static async getCapabilities(req: Request, res: Response) {
    try {
      const serviceInfo = actionAIService.getServiceInfo();

      res.json({
        success: true,
        data: {
          ...serviceInfo,
          examples: [
            {
              input: "Create an invoice for John for $300",
              action: "create_invoice",
              parameters: { client: "John", amount: 300 }
            },
            {
              input: "Add expense for office supplies $50",
              action: "create_expense", 
              parameters: { vendor: "Office Supplies Store", amount: 50, category: "Office Supplies" }
            },
            {
              input: "Generate profit loss report",
              action: "generate_report",
              parameters: { type: "profit_loss" }
            },
            {
              input: "Show me my financial summary",
              action: "view_financial_summary",
              parameters: { period: "monthly" }
            },
            {
              input: "Add client Mary with email mary@example.com",
              action: "add_client",
              parameters: { name: "Mary", email: "mary@example.com" }
            }
          ]
        }
      });

    } catch (error) {
      console.error('Get capabilities error:', error);
      res.status(500).json({ error: 'Failed to get capabilities' });
    }
  }

  /**
   * POST /api/action-ai/analyze
   * Analyze financial data and provide insights
   */
  static async analyzeFinancialData(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { data } = req.body;

      if (!data) {
        return res.status(400).json({ error: 'Financial data is required' });
      }

      // Get user's financial data if not provided
      let financialData = data;
      if (!financialData.expenses || !financialData.invoices) {
        financialData = this.getUserFinancialData(req.user.id);
      }

      // Analyze with AI
      const insights = await actionAIService.analyzeFinancialData(
        financialData,
        req.user.id
      );

      res.json({
        success: true,
        data: {
          insights,
          dataAnalyzed: financialData,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Analyze financial data error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze financial data',
        details: error.message 
      });
    }
  }

  /**
   * GET /api/action-ai/status
   * Check Action AI service status
   */
  static async getStatus(req: Request, res: Response) {
    try {
      const serviceInfo = actionAIService.getServiceInfo();
      const isAvailable = await actionAIService.processUserMessage(
        "status check",
        req.user.id
      );

      res.json({
        success: true,
        data: {
          available: isAvailable.confidence > 0,
          service: serviceInfo,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  /**
   * POST /api/action-ai/batch
   Execute multiple actions in sequence
   */
  static async executeBatch(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { actions } = req.body;

      if (!Array.isArray(actions) || actions.length === 0) {
        return res.status(400).json({ error: 'Actions array is required' });
      }

      if (actions.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 actions per batch' });
      }

      const results: ActionResult[] = [];

      for (const actionData of actions) {
        const aiAction: AIAction = {
          action: actionData.action,
          parameters: actionData.parameters || {},
          confidence: 1.0
        };

        try {
          const result = await actionAIService.executeAction(
            aiAction,
            req.user.id,
            req.user.companyId
          );
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            action: actionData.action,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: actions.length,
            successful: successCount,
            failed: actions.length - successCount,
            successRate: (successCount / actions.length * 100).toFixed(1) + '%'
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Execute batch error:', error);
      res.status(500).json({ 
        error: 'Failed to execute batch actions',
        details: error.message 
      });
    }
  }

  /**
   * Helper method to get user's financial data
   */
  private static getUserFinancialData(userId: string): any {
    try {
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]')
        .filter((e: any) => e.userId === userId);
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
        .filter((i: any) => i.userId === userId);

      return {
        expenses,
        invoices,
        totalExpenses: expenses.reduce((sum: number, e: any) => sum + e.amount, 0),
        totalRevenue: invoices.reduce((sum: number, i: any) => sum + i.amount, 0),
        transactionCount: expenses.length + invoices.length
      };
    } catch (error) {
      console.error('Failed to get user financial data:', error);
      return { expenses: [], invoices: [] };
    }
  }
}
