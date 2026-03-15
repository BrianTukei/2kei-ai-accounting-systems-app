import { Request, Response } from 'express';
import { backendAIService, ChatbotRequest } from '../services/ai/backendAIService';

export class ChatbotAPI {
  /**
   * POST /api/chatbot
   * Handle chatbot requests with Llama 3
   */
  static async handleChatbotRequest(req: Request, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if AI service is available
      const isAvailable = await backendAIService.isServiceAvailable();
      if (!isAvailable) {
        return res.status(503).json({ 
          error: 'AI service is not available. Please ensure Ollama is running with llama3 model.',
          code: 'AI_SERVICE_UNAVAILABLE'
        });
      }

      const { message, context, conversationHistory } = req.body;

      // Validate request
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (message.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      if (message.length > 2000) {
        return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
      }

      // Prepare chatbot request
      const chatbotRequest: ChatbotRequest = {
        message: message.trim(),
        userId: req.user.id,
        companyId: req.user.companyId,
        context: context || {},
        conversationHistory: conversationHistory || []
      };

      // Get AI response
      const startTime = Date.now();
      const aiResponse = await backendAIService.handleChatbotRequest(chatbotRequest);
      const processingTime = Date.now() - startTime;

      // Log the interaction (in production, use proper logging)
      console.log(`Chatbot interaction - User: ${req.user.id}, Processing time: ${processingTime}ms`);

      res.json({
        success: true,
        data: {
          response: aiResponse,
          timestamp: new Date().toISOString(),
          processingTime,
          model: 'llama3'
        }
      });

    } catch (error) {
      console.error('Chatbot API error:', error);
      res.status(500).json({ 
        error: 'Failed to process chatbot request',
        details: error.message 
      });
    }
  }

  /**
   * GET /api/chatbot/status
   * Check chatbot service status
   */
  static async getChatbotStatus(req: Request, res: Response) {
    try {
      const isAvailable = await backendAIService.isServiceAvailable();
      const models = await backendAIService.listAvailableModels();
      const serviceInfo = backendAIService.getServiceInfo();

      res.json({
        success: true,
        data: {
          available: isAvailable,
          models,
          service: serviceInfo,
          features: [
            'Navigation guidance',
            'Module instructions',
            'Receipt scanning help',
            'Expense management',
            'Invoice creation',
            'Report generation',
            'Currency conversion',
            'Multi-language support'
          ],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Chatbot status check error:', error);
      res.status(500).json({ error: 'Failed to check chatbot status' });
    }
  }

  /**
   * POST /api/chatbot/quick-actions
   * Get predefined quick actions for common tasks
   */
  static async getQuickActions(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const quickActions = [
        {
          id: 'scan-receipt',
          title: 'Scan a Receipt',
          description: 'Upload and scan a receipt image for automatic data extraction',
          icon: 'camera',
          action: 'navigate',
          target: '/receipt-scanner'
        },
        {
          id: 'add-expense',
          title: 'Add Manual Expense',
          description: 'Create an expense entry manually',
          icon: 'plus',
          action: 'navigate',
          target: '/expenses/add'
        },
        {
          id: 'create-invoice',
          title: 'Create Invoice',
          description: 'Generate a new invoice for a customer',
          icon: 'file-text',
          action: 'navigate',
          target: '/invoices/create'
        },
        {
          id: 'view-reports',
          title: 'View Financial Reports',
          description: 'Access your financial reports and analytics',
          icon: 'bar-chart',
          action: 'navigate',
          target: '/reports'
        },
        {
          id: 'manage-bills',
          title: 'Manage Bills',
          description: 'Track and pay your supplier bills',
          icon: 'calendar',
          action: 'navigate',
          target: '/bills'
        },
        {
          id: 'team-settings',
          title: 'Team Management',
          description: 'Manage team members and permissions',
          icon: 'users',
          action: 'navigate',
          target: '/team'
        }
      ];

      res.json({
        success: true,
        data: quickActions
      });
    } catch (error) {
      console.error('Get quick actions error:', error);
      res.status(500).json({ error: 'Failed to get quick actions' });
    }
  }

  /**
   * POST /api/chatbot/suggestions
   * Get contextual suggestions based on user input
   */
  static async getSuggestions(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { partialMessage } = req.body;

      if (!partialMessage || typeof partialMessage !== 'string') {
        return res.status(400).json({ error: 'Partial message is required' });
      }

      const suggestions = this.generateSuggestions(partialMessage.toLowerCase());

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  }

  /**
   * Generate contextual suggestions based on partial input
   */
  private static generateSuggestions(partialMessage: string): string[] {
    const suggestions: string[] = [];

    // Common patterns and their suggestions
    const patterns = [
      {
        keywords: ['where', 'find', 'locate', 'report'],
        suggestions: [
          'Where do I find financial reports?',
          'How do I generate a profit and loss statement?',
          'Where can I see my expense summary?'
        ]
      },
      {
        keywords: ['add', 'create', 'new', 'expense'],
        suggestions: [
          'How do I add a new expense?',
          'Where can I create an expense entry?',
          'How do I scan a receipt for expenses?'
        ]
      },
      {
        keywords: ['invoice', 'bill', 'client', 'customer'],
        suggestions: [
          'How do I create an invoice?',
          'Where do I manage my invoices?',
          'How do I send an invoice to a client?'
        ]
      },
      {
        keywords: ['scan', 'receipt', 'upload', 'camera'],
        suggestions: [
          'How do I scan a receipt?',
          'Where is the receipt scanner?',
          'How do I upload a receipt image?'
        ]
      },
      {
        keywords: ['dashboard', 'overview', 'summary'],
        suggestions: [
          'How do I get to the dashboard?',
          'What does the dashboard show?',
          'Where can I see my financial overview?'
        ]
      },
      {
        keywords: ['team', 'user', 'employee', 'member'],
        suggestions: [
          'How do I add team members?',
          'Where can I manage user permissions?',
          'How do I invite someone to my team?'
        ]
      },
      {
        keywords: ['currency', 'convert', 'exchange', 'forex'],
        suggestions: [
          'How do I change currency settings?',
          'Where can I see exchange rates?',
          'How do I handle multi-currency transactions?'
        ]
      },
      {
        keywords: ['settings', 'profile', 'account', 'company'],
        suggestions: [
          'How do I access my settings?',
          'Where can I update my company information?',
          'How do I change my account details?'
        ]
      }
    ];

    // Find matching patterns
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => partialMessage.includes(keyword))) {
        suggestions.push(...pattern.suggestions);
      }
    }

    // Remove duplicates and limit to 5 suggestions
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * POST /api/chatbot/feedback
   * Collect feedback on chatbot responses
   */
  static async submitFeedback(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { messageId, rating, comment, type } = req.body;

      // Validate feedback data
      if (!messageId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Valid messageId and rating (1-5) are required' });
      }

      const feedback = {
        id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        messageId,
        userId: req.user.id,
        rating: parseInt(rating),
        comment: comment || '',
        type: type || 'general',
        timestamp: new Date().toISOString()
      };

      // In a real implementation, save to database
      const feedbacks = JSON.parse(localStorage.getItem('chatbot-feedback') || '[]');
      feedbacks.push(feedback);
      localStorage.setItem('chatbot-feedback', JSON.stringify(feedbacks));

      console.log('Chatbot feedback submitted:', feedback.id);

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });
    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }

  /**
   * GET /api/chatbot/analytics
   * Get chatbot usage analytics (admin only)
   */
  static async getAnalytics(req: Request, res: Response) {
    try {
      // Check if user is admin (in a real implementation, check user role)
      if (!req.user || !req.user.id || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const feedbacks = JSON.parse(localStorage.getItem('chatbot-feedback') || '[]');
      
      const analytics = {
        totalInteractions: feedbacks.length,
        averageRating: feedbacks.length > 0 
          ? feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbacks.length 
          : 0,
        ratingDistribution: {
          5: feedbacks.filter((f: any) => f.rating === 5).length,
          4: feedbacks.filter((f: any) => f.rating === 4).length,
          3: feedbacks.filter((f: any) => f.rating === 3).length,
          2: feedbacks.filter((f: any) => f.rating === 2).length,
          1: feedbacks.filter((f: any) => f.rating === 1).length
        },
        recentFeedback: feedbacks.slice(-10).reverse(),
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  }
}
